import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `npm run dev` proxies API calls to the FastAPI master on :8000
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8000', '/agent': 'http://localhost:8000' } },
})
