import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// BASE_PATH: alt klasörde yayın için (ör. /hamaratlabs-web/). Alan adında boş bırak.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
