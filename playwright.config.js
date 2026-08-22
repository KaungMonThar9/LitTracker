import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
<<<<<<< HEAD
=======
    env: {
      VITE_TMDB_API_KEY: "test-key",
      VITE_BOOKS_API_KEY: "test-key",
      VITE_API_URL: "http://localhost:3001",
    },
>>>>>>> main
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
