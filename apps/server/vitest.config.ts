import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      NODE_ENV: "test",
      DATABASE_PATH: "./data/test.db",
      TMDB_API_KEY: "test-key",
      JWT_SECRET: "test-secret",
      CLIENT_URL: "http://localhost:5173",
    },
  },
});
