import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    exclude: [
      // exclude legacy tests shipped in repo root snapshot
      "test/auth.test.ts",
      "test/units.e2e.test.ts",
    ],
    globals: false,
    deps: {
      interopDefault: true,
    },
  },
  esbuild: {
    target: "node20",
  },
});
