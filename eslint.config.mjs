import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import eslintPluginImport from "eslint-plugin-import";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    plugins: { prettier: prettierPlugin, import: eslintPluginImport },
    rules: {
      "prettier/prettier": "error",
      "no-console": "warn", // Warn on console statements
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" }, // Ignore unused variables starting with _
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // Error on unused variables in TypeScript
      // quotes: ["error", "single"], // Enforce single quotes
      // semi: ["error", "always"], // Always require semicolons
      // "@typescript-eslint/explicit-function-return-type": [
      // "error",
      // { allowExpressions: true },
      // ], // Enforce explicit return types for functions
      // "no-undef": "error", // Disallow the use of undeclared variables
      // "no-magic-numbers": [
      // "warn",
      // { ignore: [0, 1], ignoreArrayIndexes: true },
      // ], // Warn on magic numbers
      // complexity: ["warn", { max: 10 }], // Warn if function complexity exceeds 10
      // "no-redeclare": "error", // Disallow variable redeclaration
      // "no-throw-literal": "error", // Disallow throwing literals as exceptions
      // "brace-style": ["error", "1tbs"], // Enforce one true brace style
      // "array-callback-return": "warn", // Warn if no return value from array callback function
      // "import/no-unresolved": "error", // Disallow unresolved imports
      // "import/no-extraneous-dependencies": "warn",
    },
  },
];
