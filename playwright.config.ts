import { defineConfig } from "@playwright/test";

const PORT = 3100;

/**
 * End-to-end tests run the production build against the database named in
 * .env.local (the Neon *dev* branch). Test accounts are deleted afterwards
 * (see e2e/teardown.ts). Use system Chrome locally; CI installs Chromium.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  globalSetup: "./e2e/setup.ts",
  globalTeardown: "./e2e/teardown.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.CI ? undefined : "chrome",
    // WebGL without a GPU
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: { BETTER_AUTH_URL: `http://localhost:${PORT}`, E2E_NO_RATE_LIMIT: "1", AI_MOCK: "1" },
  },
});
