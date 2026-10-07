import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  testMatch: '**/*.harness.pw.mjs',
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report/harness', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'cd .. && npm exec vite -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/qa/harness/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
