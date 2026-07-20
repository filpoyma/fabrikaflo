import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend (fabrikaflo_bot Fastify + Prisma) is expected on port 3005 in dev.
// Change BACKEND_URL if the backend runs elsewhere.
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3005'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/webapp/',
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      // Real backend (Fastify @ /api/fabrika prefix)
      '/api/fabrika': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      // Legacy proxies (for older backend prototypes) — kept for compatibility
      '/products':  BACKEND_URL,
      '/cart':      BACKEND_URL,
      '/orders':    BACKEND_URL,
      '/profile':   BACKEND_URL,
      '/admin':     BACKEND_URL,
    }
  }
})
