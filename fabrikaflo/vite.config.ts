import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// Backend Fastify + Prisma runs at http://127.0.0.1:3000 with prefix /api/fabrika
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000'

// https://vite.dev/config/
export default defineConfig({
  base: '/fabrikaflo/',
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
    proxy: {
      '/api/fabrika': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
