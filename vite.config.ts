import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), basicSsl()],

    base: '/',

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
        '/storage': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },

      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },

    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (normalizedId.includes('node_modules')) {
              if (
                normalizedId.includes('/react/') ||
                normalizedId.includes('/react-dom/') ||
                normalizedId.includes('/react-router/') ||
                normalizedId.includes('/react-router-dom/')
              ) {
                return 'vendor-react';
              }
              if (normalizedId.includes('lucide-react')) {
                return 'vendor-lucide';
              }
              if (normalizedId.includes('sweetalert2')) {
                return 'vendor-sweetalert2';
              }
              if (normalizedId.includes('laravel-echo') || normalizedId.includes('pusher-js')) {
                return 'vendor-echo';
              }
              if (
                normalizedId.includes('jspdf') ||
                normalizedId.includes('html2canvas') ||
                normalizedId.includes('html-to-image')
              ) {
                return 'vendor-pdf';
              }
            }
          },
        },
      },
    },
  };
});