import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      Src: fileURLToPath(new URL('./src', import.meta.url)),
      Components: fileURLToPath(new URL('./src/components', import.meta.url)),
      Utils: fileURLToPath(new URL('./src/utils', import.meta.url)),
      Static: fileURLToPath(new URL('./src/static', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:12306',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
