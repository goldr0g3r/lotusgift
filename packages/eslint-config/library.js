import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * ESLint flat-config for plain Node.js libraries (`packages/@repo/*` that are
 * not React, not Nest). Extends the shared base + scopes globals to the
 * Node runtime.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const libraryConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
];

export default libraryConfig;
