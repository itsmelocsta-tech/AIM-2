import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
export default defineConfig({
  optimizeDeps: { entries: ['qa/voice-harness/index.html'] },
  plugins: [{ name: 'voice-qa-fixture', enforce: 'pre', resolveId(id) {
    if (id.endsWith('/authenticatedFetch')) return path.resolve('qa/voice-harness/authenticatedFetch.ts');
  } }, react(), tailwindcss()],
});
