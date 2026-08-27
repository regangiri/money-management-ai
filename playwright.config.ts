import { defineConfig, devices } from '@playwright/test';

// Next 16 refuses to start a second dev server for the same directory, whatever
// port you give it — so picking a "free" port doesn't avoid a collision, it
// guarantees one whenever you already have `pnpm dev` running. Default to the
// normal dev port instead and reuse that server if it's up (see `webServer`).
const PORT = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // Tests share one backend (a Supabase project), so keep them serial rather
  // than racing each other's data.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // The app is mobile-first (no truncation at 360px, bottom tab bar), so the
    // small viewport is a first-class target rather than an afterthought.
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],

  // Skipped entirely when E2E_BASE_URL points at an already-running server.
  // Locally `reuseExistingServer` attaches to the dev server you already have
  // on :3000; if there isn't one, it starts it. In CI it builds and serves the
  // standalone output — `next start` does not work with `output: "standalone"`.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.CI
          ? `pnpm build && node .next/standalone/server.js`
          : `pnpm dev --port ${PORT}`,
        url: baseURL,
        env: process.env.CI ? { PORT: String(PORT) } : {},
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
