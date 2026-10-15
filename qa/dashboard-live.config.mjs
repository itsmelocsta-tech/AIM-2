import { defineConfig } from '@playwright/test';
if (!process.env.AIM_PREVIEW_URL || !process.env.AIM_TESTED_SHA) throw new Error('BLOCKED: exact-head READY preview and SHA required.');
export default defineConfig({
  testDir: './specs', testMatch: ['**/dashboard.pw.mjs', '**/atmosphere.pw.mjs'], workers: 1, retries: 0, timeout: 45000,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report/dashboard-live', open: 'never' }]],
  use: { baseURL: process.env.AIM_PREVIEW_URL, trace: 'off', video: 'off', screenshot: 'off' },
  projects: [
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 900 } } },
  ],
});
