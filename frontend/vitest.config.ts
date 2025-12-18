import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});


