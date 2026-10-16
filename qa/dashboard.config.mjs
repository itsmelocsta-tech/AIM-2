import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './specs', testMatch: ['**/dashboard.pw.mjs', '**/atmosphere.pw.mjs'], workers: 1, retries: 0, timeout: 45000,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report/dashboard', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 900 } } },
  ],
  webServer: { command: 'cd .. && npm run dev', url: 'http://127.0.0.1:3000/api/health', reuseExistingServer: !process.env.CI, timeout: 120000 },
});
