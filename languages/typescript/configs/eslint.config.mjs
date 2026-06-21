// Pairs with TYPESCRIPT-CODE-QUALITY-GATE.md (Normative Core + Complexity Limits + section 7).
// Flat config. Requires: eslint, typescript-eslint.
// Run: eslint . --max-warnings=0
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Config files and build output are not type-checked source.
    ignores: [
      "dist/**",
      "build/**",
      "coverage/**",
      "**/*.generated.*",
      "**/*.config.{js,cjs,mjs,ts}",
      "eslint.config.{js,cjs,mjs}",
    ],
  },
  {
    // Typed linting applies only to TypeScript source.
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // MUST NOT (Normative Core)
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": "warn",

      // Complexity Limits (doc maximums)
      "complexity": ["error", 10],
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
      "max-lines": ["error", { max: 600, skipBlankLines: true, skipComments: true }],
      "max-params": ["error", 6],
      "max-depth": ["error", 3],
      "max-nested-callbacks": ["error", 3],
    },
  },
);
