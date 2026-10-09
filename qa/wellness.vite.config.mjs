import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
const fixture = fileURLToPath(new URL('./wellness-harness/fixtures.ts', import.meta.url));
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: [
    { find: /.*\/context\/AuthContext$/, replacement: fixture },
    { find: /.*\/repositories\/firestoreRepository$/, replacement: fixture },
    { find: /.*\/services\/entitlementApi$/, replacement: fixture },
  ] },
});
