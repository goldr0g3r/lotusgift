/**
 * scripts/scaffold-package.ts
 *
 * Generates an empty `packages/<name>/` OR `services/<name>/` skeleton.
 *
 * Usage:
 *   pnpm dlx tsx scripts/scaffold-package.ts package <name>
 *   pnpm dlx tsx scripts/scaffold-package.ts service <name>
 *
 * `package` skeleton:
 *   - package.json (name "@lotusgift/<name>", type "module", workspace devDeps)
 *   - tsconfig.json (extends @repo/typescript-config/base.json)
 *   - src/index.ts (empty placeholder export)
 *   - README.md (one-line description from the PACKAGE_DESCRIPTIONS manifest)
 *
 * `service` skeleton (same as package, plus):
 *   - src/<name>.module.ts (empty NestJS module class)
 *   - src/index.ts exports the module
 *   - peerDependencies on @nestjs/{common,core}, reflect-metadata, rxjs
 *
 * Must be run from the repo root.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const PACKAGE_DESCRIPTIONS: Record<string, string> = {
  // shared infra packages
  "prettier-config": "Shared Prettier configuration for LotusGift workspace.",
  types: "Shared TypeScript types used across services and apps.",
  validators:
    "Zod validators \u2014 single source of truth for runtime types + DTOs.",
  events:
    "Transport-agnostic event schemas with __schemaVersion + idempotency key.",
  "openapi-spec":
    "Shared x-* OpenAPI extensions + RFC 9457 error envelopes.",
  database: "Mongoose helper + collection-namespace utility.",
  config: "Environment Zod schema + safe getter.",
  utils:
    "OutboxPort, redactor, ulid trace-id, pino logger, retry helper.",
  observability:
    "OpenTelemetry bootstrap + browser RUM SDK initialiser.",
  "analytics-sdk":
    "PostHog browser + server wrapper for typed event capture.",
  "feature-flags":
    "PostHog flags wrapper for typed feature-flag evaluation.",
  "auth-client":
    "Better-Auth client wrapper with session helpers for the 4 Next.js apps.",
  "design-tokens":
    "TypeScript source-of-truth for design tokens, emitting typed TS + SCSS variables.",
  ui: "Radix Primitives + CSS Modules + Sass + Lucide icons; LotusGift design system.",

  // service modules (corporate gifting + base marketplace)
  "auth-service":
    "Better-Auth + organization plugin (vendor-org / corporate-buyer-org / internal-staff-org).",
  "vendor-service":
    "Vendor onboarding with admin-approval gate + multi-warehouse registry + SLA scoring.",
  "product-service":
    "Catalog + corporate-gifting taxonomy + R2 image upload + Atlas Search sync.",
  "inventory-service":
    "Per-(variant, warehouse) stock ledger + Redis reservations + low-stock alerts.",
  "customization-service":
    "Versioned art uploads to R2 + mockup approval workflow + in-app thread.",
  "rfq-service":
    "Quote workflow + auto-router (cart vs RFQ) + negotiated pricing + quote-to-PO conversion.",
  "recipient-list-service":
    "CSV/Excel recipient list upload + Zod validation + per-recipient personalization.",
  "order-service":
    "Multi-recipient order model + saga orchestrator + per-shipment compensation.",
  "payment-service":
    "Razorpay UPI/cards/netbanking/wallets + COD + PO + credit terms.",
  "shipping-service":
    "Shiprocket + Delhivery + Bluedart adapters + per-warehouse pickup + many destinations.",
  "tax-service":
    "GST CGST/SGST/IGST per-shipment + HSN registry + IRP e-invoice for B2B.",
  "promotions-service":
    "Vendor tiers + volume discounts + coupons + auto-replenish subscriptions.",
  "notification-service":
    "Resend email + MSG91 SMS/WhatsApp + in-app stream + Web Push.",
  "insights-service":
    "Vendor AI demand forecasting + dead-stock + reorder-point + dynamic-pricing.",
  "review-service": "Customer reviews + sentiment via insights-service.",
  "support-service": "Tickets, RMA, warranty.",
};

const args = process.argv.slice(2);
if (args.length !== 2 || (args[0] !== "package" && args[0] !== "service")) {
  console.error(
    "Usage: tsx scripts/scaffold-package.ts <package|service> <name>\n" +
      "Known names: " +
      Object.keys(PACKAGE_DESCRIPTIONS).join(", "),
  );
  process.exit(1);
}

const kind = args[0] as "package" | "service";
const name = args[1]!;
const description =
  PACKAGE_DESCRIPTIONS[name] ?? `${name} (LotusGift internal ${kind}).`;
const repoRoot = process.cwd();
const folder = kind === "package" ? "packages" : "services";
const dir = path.join(repoRoot, folder, name);

if (fs.existsSync(dir)) {
  console.error(`${folder}/${name}/ already exists. Aborting.`);
  process.exit(1);
}

fs.mkdirSync(path.join(dir, "src"), { recursive: true });

interface PackageJson {
  name: string;
  version: string;
  private: boolean;
  type: string;
  main: string;
  types: string;
  exports: Record<string, string>;
  scripts: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies: Record<string, string>;
}

const orgPrefix = kind === "package" ? "@repo" : "@lotusgift";
const basePkg: PackageJson = {
  name: `${orgPrefix}/${name}`,
  version: "0.0.0",
  private: true,
  type: "module",
  main: "./src/index.ts",
  types: "./src/index.ts",
  exports: {
    ".": "./src/index.ts",
  },
  scripts: {
    lint: "eslint .",
    "check-types": "tsc --noEmit",
  },
  devDependencies: {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    typescript: "5.9.2",
  },
};

if (kind === "service") {
  basePkg.peerDependencies = {
    "@nestjs/common": "^11",
    "@nestjs/core": "^11",
    "reflect-metadata": "^0.2",
    rxjs: "^7",
  };
  Object.assign(basePkg.devDependencies, {
    "@nestjs/common": "^11",
    "@nestjs/core": "^11",
    "reflect-metadata": "^0.2",
    rxjs: "^7",
  });
}

const tsconfig = {
  extends: "@repo/typescript-config/base.json",
  include: ["src/**/*.ts"],
  exclude: ["node_modules", "dist"],
  compilerOptions: {
    outDir: "dist",
  },
};

// Convert kebab-case "auth-service" to PascalCase "AuthService"
function toPascal(s: string): string {
  return s
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

const className = toPascal(name); // e.g., AuthService
const moduleName = className + "Module"; // e.g., AuthServiceModule (a bit redundant but explicit)

let indexTs: string;
let moduleTs: string | null = null;

if (kind === "service") {
  indexTs = `export { ${moduleName} } from "./${name}.module.js";\n`;
  moduleTs = `import { Module } from "@nestjs/common";

@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class ${moduleName} {}
`;
} else {
  indexTs = `// Entry point for @lotusgift/${name}.
// Implementation arrives in a later phase (see parent plan section 7).
export {};
`;
}

const readme = `# ${orgPrefix}/${name}

${description}

> Scaffolded in PR-1 (chore(scaffold)) on ${new Date()
  .toISOString()
  .slice(0, 10)}. Implementation arrives in a later phase per the parent plan.
`;

fs.writeFileSync(
  path.join(dir, "package.json"),
  JSON.stringify(basePkg, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(dir, "tsconfig.json"),
  JSON.stringify(tsconfig, null, 2) + "\n",
);
fs.writeFileSync(path.join(dir, "src", "index.ts"), indexTs);
if (moduleTs) {
  fs.writeFileSync(path.join(dir, "src", `${name}.module.ts`), moduleTs);
}
fs.writeFileSync(path.join(dir, "README.md"), readme);

console.log(`Created ${folder}/${name}/ (kind=${kind})`);
