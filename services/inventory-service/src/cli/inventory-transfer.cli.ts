/**
 * Admin CLI — inter-warehouse stock transfer.
 * Usage: pnpm inventory:transfer --from <id> --to <id> --variant <id> --qty <n> --reason <text>
 */
import { NestFactory } from '@nestjs/core';

import { loadEnv } from '@repo/config';

import { InventoryServiceModule } from '../inventory-service.module.js';
import { TransferService } from '../services/transfer.service.js';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg?.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const from = args.from;
  const to = args.to;
  const variant = args.variant;
  const qty = Number(args.qty);
  const reason = args.reason;
  if (!from || !to || !variant || !Number.isFinite(qty) || qty <= 0 || !reason) {
    console.error(
      'Usage: inventory:transfer --from <warehouseId> --to <warehouseId> --variant <variantId> --qty <n> --reason <text>',
    );
    process.exit(1);
  }

  const env = loadEnv(process.env);
  const app = await NestFactory.createApplicationContext(
    InventoryServiceModule.forRoot(env),
    { logger: ['error', 'warn', 'log'] },
  );
  try {
    const transfers = app.get(TransferService);
    const row = await transfers.transfer({
      fromWarehouseId: from,
      toWarehouseId: to,
      variantId: variant,
      qty,
      reasonNote: reason,
      actorId: 'admin-cli',
    });
    console.log(JSON.stringify({ transferId: row.id, status: row.status }));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void main();
