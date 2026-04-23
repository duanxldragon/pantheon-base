import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 30000,
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: 'arco-icons',
              test: /node_modules[\\/]@arco-design[\\/]web-react[\\/]icon[\\/]/,
            },
            {
              name: 'arco-heavy',
              test: /node_modules[\\/]@arco-design[\\/]web-react[\\/](es|lib)[\\/](Table|Pagination|Tree|TreeSelect|Select|Trigger|Checkbox)[\\/]/,
            },
            {
              name: 'arco-vendor',
              test: /node_modules[\\/]@arco-design[\\/]/,
            },
            {
              name: 'app-vendor',
              test: /node_modules[\\/](axios|zustand|i18next|react-i18next)[\\/]/,
            },
          ],
        },
      },
    },
  },
})
