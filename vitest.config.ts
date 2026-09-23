import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    globals: false,
    env: {
      // Never touch the network from tests: serve the bundled snapshot.
      NEWS_SPLIT_OFFLINE: "always",
      CACHE_FILE: ".cache/test-newssplit.json",
      USERS_FILE: ".cache/test-newssplit-users.json",
    },
  },
});
