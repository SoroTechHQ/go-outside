import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "lib/search/__tests__/**/*.test.ts",
      "lib/social/__tests__/**/*.test.ts",
    ],
    globals: true,
    coverage: {
      provider: "v8",
      include: ["lib/search/**/*.ts", "lib/social/**/*.ts"],
      exclude: [
        "lib/search/__tests__/**",
        "lib/search/index.ts",
        "lib/social/__tests__/**",
      ],
    },
  },
});
