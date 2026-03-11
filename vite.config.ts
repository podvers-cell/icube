import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig((_mode) => {
  return {
    plugins: [react(), tailwindcss()],
    // Server-only secrets (e.g. GEMINI_API_KEY) must NOT be in define – they would leak into client bundle.
    // Use them only in server/ via process.env at runtime.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } },
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
