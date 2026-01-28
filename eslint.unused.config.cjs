const { defineConfig, globalIgnores } = require("eslint/config");
const unusedImports = require("eslint-plugin-unused-imports");
const tsParser = require("@typescript-eslint/parser");

module.exports = defineConfig([
  globalIgnores(["dist", "node_modules"]),
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "unused-imports": unusedImports,
    },
    languageOptions: {
      parser: tsParser, // ← must pass the module, not a string
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
]);
