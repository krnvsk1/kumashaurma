import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5199',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // 👇 Добавляем эту секцию для разрешения конфликтов
  resolve: {
    dedupe: ['react', 'react-dom']
  }
})