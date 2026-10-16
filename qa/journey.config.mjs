import { defineConfig } from '@playwright/test';

const origin = new URL(process.env.AIM_PREVIEW_URL || 'https://invalid.example');
if (!/^aim-2-[a-z0-9]+-itsmelocsta-5904\.vercel\.app$/.test(origin.hostname) ||
    origin.protocol !== 'https:' || !/^[a-f0-9]{40}$/.test(process.env.AIM_TESTED_SHA || '') ||
    process.env.AIM_ALLOW_DISPOSABLE_ACCOUNT !== 'true') {
  throw new Error('BLOCKED: exact-commit AIM preview and explicit disposable-account test mode required.');
}

export default defineConfig({
  testDir: './specs', testMatch: '**/*.journey.pw.mjs',
  workers: 1, retries: 0, timeout: 420000,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report/journey', open: 'never' }]],
  use: {
    baseURL: origin.origin, browserName: 'chromium',
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    actionTimeout: 15000, navigationTimeout: 30000,
    trace: 'off', video: 'off', screenshot: 'off',
  },
});
