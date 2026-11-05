/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // Em desenvolvimento, /api pode ser redirecionado ao backend sem CORS.
      // Defina VITE_DEV_PROXY_TARGET=http://localhost:3000 no .env.local.
      proxy: env.VITE_DEV_PROXY_TARGET
        ? { '/api': { target: env.VITE_DEV_PROXY_TARGET, changeOrigin: true } }
        : undefined,
    },
    test: {
      environment: 'node',
    },
  };
});
