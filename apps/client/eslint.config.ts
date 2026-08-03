import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";

export default defineConfig([
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react,
    },
    languageOptions: {
      parserOptions: {
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "react/react-in-jsx-scope": "off",
    },
  },
]);
