import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './specs', testMatch: '**/*.voice.pw.mjs', workers: 1, retries: 0, timeout: 30000,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report/voice', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
  webServer: { command: 'cd .. && npm exec vite -- --config qa/voice.vite.config.mjs --host 127.0.0.1 --port 4174', url: 'http://127.0.0.1:4174/qa/voice-harness/', timeout: 120000 },
});
