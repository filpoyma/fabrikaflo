import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000'

export default defineConfig({
  base: '/webapp/',
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        ref: true,
        svgo: false,
        titleProp: true,
      },
      include: '**/*.svg',
    }),
  ],
  server: {
    host: true,
    port: 5174,
    allowedHosts: true,
    proxy: {
      '/api/fabrika': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
