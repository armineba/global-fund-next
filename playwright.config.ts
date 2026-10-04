import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3191";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    reducedMotion: "reduce",
    trace: {
      mode: "retain-on-failure",
      screenshots: false,
      snapshots: true,
      sources: true,
    },
  },
  webServer: {
    command: "node_modules/.bin/tsx tests/e2e/server.ts",
    env: {
      DATABASE_URL: "",
      STORAGE_FILE: "false",
      PUBLIC_ORIGIN: baseURL,
      HOST: "127.0.0.1",
      PORT: "3191",
    },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
