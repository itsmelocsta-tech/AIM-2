import { defineConfig } from '@playwright/test';

const preview = new URL(process.env.AIM_PREVIEW_URL || 'https://invalid.local');
if (!process.env.AIM_TESTED_SHA || preview.protocol !== 'https:' ||
    !/^aim-2-[a-z0-9]+-itsmelocsta-5904\.vercel\.app$/.test(preview.hostname)) {
  throw new Error('BLOCKED: an immutable READY AIM preview and tested commit are required.');
}

export default defineConfig({
  testDir: './specs', testMatch: '**/atmosphere.signed-in.pw.mjs',
  workers: 1, retries: 0, timeout: 180000,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report/atmosphere-live', open: 'never' }]],
  use: {
    baseURL: preview.origin, browserName: 'chromium',
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    trace: 'off', video: 'off', screenshot: 'off', actionTimeout: 15000,
  },
});
