import { defineConfig } from "eslint/config";
import eslintPluginAstro from "eslint-plugin-astro";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist/**", ".astro/**", "node_modules/**"] },
  ...eslintPluginAstro.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx,mjs,js,cjs}"],
  })),
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: eslintPluginAstro.parser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".astro"],
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
  eslintConfigPrettier,
);
