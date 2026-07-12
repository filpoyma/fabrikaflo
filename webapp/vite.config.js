import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/webapp/',
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/products': 'http://127.0.0.1:8000',
      '/cart': 'http://127.0.0.1:8000',
      '/orders': 'http://127.0.0.1:8000',
      '/profile': 'http://127.0.0.1:8000',
      '/admin': 'http://127.0.0.1:8000'
    }
  }
})
