import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**"],
  },
  {
    plugins: {
      "@next/next": {
        meta: {
          name: "@next/eslint-plugin-next",
        },
        rules: {},
      },
    },
    rules: {},
  },
]);
