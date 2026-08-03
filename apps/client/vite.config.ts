import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@willyboxd/shared": resolve(__dirname, "../../packages/shared/src"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/lib/test-setup.ts"],
    globals: true,
  },
});
