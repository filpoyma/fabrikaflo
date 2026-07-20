import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend (fabrikaflo_bot Fastify + Prisma) is expected on port 3000 in dev.
// Change BACKEND_URL if the backend runs elsewhere.
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/webapp/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api/fabrika': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
