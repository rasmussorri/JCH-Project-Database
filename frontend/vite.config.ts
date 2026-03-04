import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env from frontend/ so proxy works even when dev server is run from project root
  const env = loadEnv(mode, __dirname, '')
  const proxyTarget = (env.VITE_SUPABASE_PROXY_TARGET || env.VITE_SUPABASE_URL)?.replace(/\/$/, '')

  const proxy = proxyTarget
    ? {
        '/rest': { target: proxyTarget, changeOrigin: true, secure: true },
        '/storage': { target: proxyTarget, changeOrigin: true, secure: true },
        '/auth': { target: proxyTarget, changeOrigin: true, secure: true },
        '/functions': { target: proxyTarget, changeOrigin: true, secure: true },
        '/realtime': { target: proxyTarget, changeOrigin: true, secure: true },
      }
    : undefined

  if (proxy) {
    console.log('[vite] Supabase proxy target:', proxyTarget)
  }

  return {
    plugins: [react()],
    server: { proxy },
  }
})
