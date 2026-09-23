import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      // poc-3d.html: throwaway WebGL/mascot POC (sports-training-api#68), not linked from the
      // app's nav — kept as a second Vite entry so it still builds/serves like a real page
      // instead of living entirely outside the toolchain.
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        poc3d: path.resolve(import.meta.dirname, 'poc-3d.html'),
      },
    },
  },
})
