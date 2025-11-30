import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/profile': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/add-friend': 'http://localhost:5001',
      '/accept-friend': 'http://localhost:5001',
      '/change-password': 'http://localhost:5001',
      '/logout': 'http://localhost:5001',
      '/session-status': 'http://localhost:5001'
    }
  }
})
