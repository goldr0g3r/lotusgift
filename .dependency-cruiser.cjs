/** @type {import('dependency-cruiser').IConfiguration} */
// LotusGift v2 — architecture-layers + microservice-boundaries enforcement.
// Wired by .github/workflows/dep-cruiser.yml. Source-of-truth for the L0→L6
// layering captured in .cursor/rules/architecture-layers.mdc and the
// cross-service constraints captured in .cursor/rules/microservice-boundaries.mdc.

module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Modules MUST NOT depend on themselves (directly or transitively). Refactor to extract the shared piece into a lower layer.",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment:
        "Files with no dependents AND no dependencies are likely dead code. Allow-listed: config files, package entries (index.ts), ESLint/Jest/Next/Turbo configs, type declarations, scripts, and tsx UI primitives still wired in P0-design (PR-6).",
      from: {
        orphan: true,
        pathNot: [
          "[.]d[.]ts$",
          "(^|/)tsconfig[.]json$",
          "(^|/)scripts/",
          "(^|/)src/index[.]ts$",
          "(^|/)src/[a-z-]+[.]tsx?$",
          "(^|/)eslint[.]config[.](js|cjs|mjs|ts)$",
          "(^|/)jest[.]config[.](js|cjs|mjs|ts)$",
          "(^|/)next[.]config[.](js|cjs|mjs|ts)$",
          "(^|/)turbo[.]json$",
          "(^|/)nest-cli[.]json$",
          "(^|/)\\.prettierrc\\.(js|cjs|mjs|ts)$",
          // P2 (PR-10): per-service skeleton shells in @repo/validators +
          // @repo/events. Empty by design; populated in P5+ service phases.
          "^packages/(validators|events)/src/[a-z-]+/index[.]ts$",
        ],
      },
      to: {},
    },
    {
      name: "no-deprecated-core",
      severity: "warn",
      comment: "Don't use Node core APIs flagged as deprecated.",
      from: {},
      to: {
        dependencyTypes: ["core"],
        path: [
          "^(domain|punycode|sys|querystring|_linklist|_stream_wrap|constants)$",
        ],
      },
    },
    {
      name: "no-deprecated-npm",
      severity: "warn",
      comment: "Don't use deprecated npm packages.",
      from: {},
      to: {
        dependencyTypes: ["deprecated"],
      },
    },
    {
      name: "no-non-package-json",
      severity: "error",
      comment:
        "Don't depend on packages that aren't declared in the consuming workspace's package.json.",
      from: {},
      to: {
        dependencyTypes: ["npm-no-pkg", "npm-unknown"],
      },
    },
    {
      name: "not-to-unresolvable",
      severity: "error",
      comment:
        "Don't import modules that can't be resolved. Catches typos and missing dependencies before runtime.",
      from: {},
      to: {
        couldNotResolve: true,
      },
    },
    {
      name: "not-to-test",
      severity: "error",
      comment:
        "Production code MUST NOT import from test files. Move shared fixtures to a dedicated package or keep them in __tests__/.",
      from: {
        pathNot: [
          "\\.(spec|test)\\.[jt]sx?$",
          "(^|/)__tests__/",
          "(^|/)test/",
        ],
      },
      to: {
        path: ["\\.(spec|test)\\.[jt]sx?$", "(^|/)__tests__/"],
      },
    },
    {
      name: "no-cross-service-import",
      severity: "error",
      comment:
        "L4 services MUST NOT reach into another service's internals. Imports that resolve to a sibling service's `src/index.ts` (the public package surface) ARE allowed — that's the explicit contract. Anything deeper is a layering violation; use @repo/api/internal for cross-service reads or OutboxPort for writes. See .cursor/rules/microservice-boundaries.mdc + phase-7 D12/D13 for the public-surface exception.",
      from: {
        path: "^services/([^/]+)/",
        pathNot: "\\.(spec|test)\\.[jt]sx?$",
      },
      to: {
        path: "^services/([^/]+)/",
        pathNot: ["^services/$1/", "^services/[^/]+/src/index\\.ts$"],
      },
    },
    {
      name: "no-cross-service-import-test",
      severity: "warn",
      comment:
        "Cross-service imports in test files (e.g. importing fixtures, types, or stubs) are tolerated as a warning rather than an error — tests SHOULD prefer the package public surface (services/*/src/index.ts) but legacy tests are grandfathered until the next test-overhaul PR.",
      from: {
        path: "^services/([^/]+)/.*\\.(spec|test)\\.[jt]sx?$",
      },
      to: {
        path: "^services/([^/]+)/",
        pathNot: ["^services/$1/", "^services/[^/]+/src/index\\.ts$"],
      },
    },
    {
      name: "no-service-importing-gateway",
      severity: "error",
      comment:
        "L4 services MUST NOT import L5 apps/api-gateway code. The gateway hosts services; not the other way around.",
      from: {
        path: "^services/",
      },
      to: {
        path: "^apps/api-gateway/",
      },
    },
    {
      name: "no-service-importing-web-app",
      severity: "error",
      comment:
        "L4 services MUST NOT import L6 web-* apps. Web apps consume the API; services know nothing about them.",
      from: {
        path: "^services/",
      },
      to: {
        path: "^apps/web-",
      },
    },
    {
      name: "no-package-importing-app",
      severity: "error",
      comment:
        "L0-L3 packages MUST NOT import L5/L6 apps. Push shared code into a lower-layer package instead.",
      from: {
        path: "^packages/",
      },
      to: {
        path: "^apps/",
      },
    },
    {
      name: "no-package-importing-service",
      severity: "error",
      comment:
        "L0-L3 packages MUST NOT import L4 services. Services consume packages; the inverse is a layering violation.",
      from: {
        path: "^packages/",
      },
      to: {
        path: "^services/",
      },
    },
    {
      name: "no-l0-importing-l1-or-above",
      severity: "error",
      comment:
        "L0 config packages MUST NOT import any other workspace package. They are leaf nodes.",
      from: {
        path: "^packages/(eslint-config|typescript-config|jest-config|prettier-config)/",
      },
      to: {
        path: "^(packages|services|apps)/",
        pathNot:
          "^packages/(eslint-config|typescript-config|jest-config|prettier-config)/",
      },
    },
    {
      name: "no-l1-importing-l2-or-above",
      severity: "error",
      comment:
        "L1 packages (types/validators/events/openapi-spec) may only import L0.",
      from: {
        path: "^packages/(types|validators|events|openapi-spec)/",
      },
      to: {
        path: "^(packages|services|apps)/",
        pathNot: [
          "^packages/(eslint-config|typescript-config|jest-config|prettier-config)/",
          "^packages/(types|validators|events|openapi-spec)/",
        ],
      },
    },
    {
      name: "no-l2-importing-l3-or-above",
      severity: "error",
      comment:
        "L2 packages (database/config/utils/observability) may only import L0–L1.",
      from: {
        path: "^packages/(database|config|utils|observability)/",
      },
      to: {
        path: "^(packages|services|apps)/",
        pathNot: [
          "^packages/(eslint-config|typescript-config|jest-config|prettier-config)/",
          "^packages/(types|validators|events|openapi-spec)/",
          "^packages/(database|config|utils|observability)/",
        ],
      },
    },
    {
      name: "no-l3-importing-l4-or-above",
      severity: "error",
      comment:
        "L3 packages (analytics-sdk/feature-flags/auth-client/api/design-tokens/ui) may only import L0–L2 + sibling L3.",
      from: {
        path: "^packages/(analytics-sdk|feature-flags|auth-client|api|design-tokens|ui)/",
      },
      to: {
        path: "^(services|apps)/",
      },
    },
    {
      name: "no-web-app-importing-api-gateway",
      severity: "error",
      comment:
        "L6 web-* apps MUST NOT import L5 apps/api-gateway code directly — go through @repo/api (Kubb-emitted TanStack Query hooks).",
      from: {
        path: "^apps/web-",
      },
      to: {
        path: "^apps/api-gateway/",
      },
    },
    {
      name: "no-web-app-importing-service",
      severity: "error",
      comment:
        "L6 web-* apps MUST NOT import L4 services — go through @repo/api.",
      from: {
        path: "^apps/web-",
      },
      to: {
        path: "^services/",
      },
    },
  ],

  options: {
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      path: [
        "node_modules",
        "_old",
        "(^|/)dist/",
        "(^|/)\\.next/",
        "(^|/)\\.turbo/",
        "(^|/)coverage/",
        "\\.d\\.ts$",
      ],
    },
    includeOnly: {
      path: ["^(apps|packages|services)/"],
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
