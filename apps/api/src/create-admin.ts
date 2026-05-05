/**
 * Create or promote an admin user.
 *
 * Usage:
 *   pnpm --filter api run create-admin -- <email> <password> [name]
 *
 * Examples:
 *   pnpm --filter api run create-admin -- you@yourcompany.com 'StrongPass!23' 'Your Name'
 *   pnpm --filter api run create-admin -- existing@user.com '' (promote-only)
 *
 * Notes:
 * - Writes both the better-auth `user` doc (with role=admin) and the
 *   `account` doc (with hashed password, providerId="credential").
 * - If the user already exists, the role is upgraded to `admin`. If a
 *   password is provided, the credential password is also rotated.
 */

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { hashPassword } from 'better-auth/crypto';

interface CliArgs {
  email: string;
  password: string;
  name?: string;
}

async function prompt(question: string, opts: { silent?: boolean } = {}) {
  const rl = readline.createInterface({ input, output });
  if (opts.silent) {
    const stdout = output as NodeJS.WriteStream & { _writeToOutput?: unknown };
    const original = (stdout as unknown as { _writeToOutput: unknown })
      ._writeToOutput;
    (stdout as unknown as { _writeToOutput: (s: string) => void })._writeToOutput =
      function maskedWrite(this: { output: NodeJS.WriteStream }, s: string) {
        if (s.includes('\n')) this.output.write(s);
        else this.output.write('*');
      };
    try {
      const answer = await rl.question(question);
      output.write('\n');
      return answer;
    } finally {
      (stdout as unknown as { _writeToOutput: unknown })._writeToOutput =
        original;
      rl.close();
    }
  }
  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}

async function getArgs(): Promise<CliArgs> {
  const [, , emailArg, passwordArg, ...nameParts] = process.argv;
  let email = emailArg ?? '';
  let password = passwordArg ?? '';
  const nameFromArgs = nameParts.join(' ').trim();

  if (!email) email = (await prompt('Email: ')).trim();
  if (!email) {
    throw new Error('Email is required.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`"${email}" is not a valid email.`);
  }

  if (!password) {
    password = await prompt('Password (leave blank to keep existing): ', {
      silent: true,
    });
  }

  if (password && password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  let name: string | undefined = nameFromArgs || undefined;
  if (!name && !passwordArg) {
    const answer = (await prompt('Display name (optional): ')).trim();
    name = answer || undefined;
  }

  return { email: email.toLowerCase(), password, name };
}

async function main() {
  const { email, password, name } = await getArgs();
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lotusgift';

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error('Failed to access MongoDB database.');

  const users = db.collection('user');
  const accounts = db.collection('account');

  const existing = await users.findOne({ email });
  const now = new Date();

  if (existing) {
    const update: Record<string, unknown> = { role: 'admin', updatedAt: now };
    if (name) update.name = name;
    await users.updateOne({ _id: existing._id }, { $set: update });

    if (password) {
      const hashed = await hashPassword(password);
      const credential = await accounts.findOne({
        userId: existing._id,
        providerId: 'credential',
      });
      if (credential) {
        await accounts.updateOne(
          { _id: credential._id },
          { $set: { password: hashed, updatedAt: now } },
        );
      } else {
        await accounts.insertOne({
          _id: randomUUID() as unknown as never,
          accountId: existing._id,
          providerId: 'credential',
          userId: existing._id,
          password: hashed,
          createdAt: now,
          updatedAt: now,
        });
      }
      console.log(`Updated ${email} → role=admin (password rotated).`);
    } else {
      console.log(`Updated ${email} → role=admin.`);
    }
    return;
  }

  if (!password) {
    throw new Error(
      'A password is required when creating a new admin. Re-run with a password.',
    );
  }

  const id = randomUUID();
  const hashed = await hashPassword(password);

  await users.insertOne({
    _id: id as unknown as never,
    email,
    name: name || email.split('@')[0],
    role: 'admin',
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  });

  await accounts.insertOne({
    _id: randomUUID() as unknown as never,
    accountId: id,
    providerId: 'credential',
    userId: id,
    password: hashed,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Created admin ${email}.`);
}

main()
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n✖ ${message}`);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
