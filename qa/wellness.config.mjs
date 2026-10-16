import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './specs', testMatch: '**/*.wellness.pw.mjs', workers: 1, retries: 0, timeout: 30000,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report/wellness', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4176', trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
  webServer: { command: 'cd .. && npm exec vite -- --config qa/wellness.vite.config.mjs --host 127.0.0.1 --port 4176', url: 'http://127.0.0.1:4176/qa/wellness-harness/', timeout: 120000 },
});
