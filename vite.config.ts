import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import manifest from './manifest.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
  ],
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: {
        panel: 'index.html',
      },
      output: {
        manualChunks(id) {
          if (id.includes('src/utils/stackEngine') || id.includes('src/utils/stack-db.json')) {
            return 'stack-engine';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
})
