/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
  },
  optimizeDeps: {
    exclude: ['@rollup/rollup-win32-x64-msvc']
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress rollup warnings about native modules
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      }
    }
  }
})
