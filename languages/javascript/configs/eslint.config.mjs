// Pairs with REFERENCE.md (Normative Core + Complexity Limits + security).
// Flat config for plain JavaScript (no type-aware rules — JS has no static types).
// Requires: eslint, @eslint/js, eslint-plugin-promise, eslint-plugin-security.
// Run: eslint . --max-warnings=0
import js from "@eslint/js";
import promise from "eslint-plugin-promise";
import security from "eslint-plugin-security";

export default [
  {
    ignores: ["dist/**", "build/**", "coverage/**", "**/*.min.js", "**/*.generated.js"],
  },
  js.configs.recommended,
  promise.configs["flat/recommended"],
  security.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
    },
    rules: {
      // MUST NOT (Normative Core)
      eqeqeq: ["error", "always"], // === not ==
      "no-var": "error",
      "prefer-const": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error", // new Function(...)
      "no-console": "warn",
      "no-param-reassign": ["error", { props: false }],
      "promise/no-callback-in-promise": "error",
      "promise/always-return": "error",

      // Complexity Limits (doc maximums)
      complexity: ["error", 10],
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
      "max-lines": ["error", { max: 600, skipBlankLines: true, skipComments: true }],
      "max-params": ["error", 6],
      "max-depth": ["error", 3],
      "max-nested-callbacks": ["error", 3],
    },
  },
];
