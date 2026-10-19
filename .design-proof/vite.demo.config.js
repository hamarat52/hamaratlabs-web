// Yalnız izole doğrulama sunucusu (site build'ine dahil değil):
// npx vite --config .design-proof/vite.demo.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: here,
  plugins: [react()],
  server: { fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
});
