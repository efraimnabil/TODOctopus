import { defineConfig } from "@playwright/test";

const PORT = 3100;

/**
 * Records the README demo (video + screenshots). Same server and test-account
 * cleanup as the e2e suite; run with `pnpm media`, then `pnpm media:gif`.
 */
export default defineConfig({
  testDir: "e2e-media",
  workers: 1,
  timeout: 180_000,
  reporter: [["list"]],
  globalSetup: "./e2e/setup.ts",
  globalTeardown: "./e2e/teardown.ts",
  outputDir: "test-results/media",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.CI ? undefined : "chrome",
    viewport: { width: 1280, height: 720 },
    video: { mode: "on", size: { width: 1280, height: 720 } },
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] },
  },
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: { BETTER_AUTH_URL: `http://localhost:${PORT}`, E2E_NO_RATE_LIMIT: "1", AI_MOCK: "1" },
  },
});
