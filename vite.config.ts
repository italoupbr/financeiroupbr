import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// Read the raw API key directly from the file — bypasses dotenv-expand
// so the literal $ in the Asaas key is preserved.
function readRawEnv(file: string, key: string): string {
  try {
    const lines = fs.readFileSync(path.resolve(__dirname, file), 'utf8').split('\n')
    const line = lines.find(l => l.startsWith(`${key}=`))
    return line ? line.slice(key.length + 1).trim() : ''
  } catch {
    return ''
  }
}

const asaasKey = readRawEnv('.env.local', 'ASAAS_API_KEY')
const asaasTarget = readRawEnv('.env.local', 'ASAAS_ENV') === 'production'
  ? 'https://www.asaas.com'
  : 'https://sandbox.asaas.com'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Browser calls /asaas-api/* → proxy rewrites to Asaas, injects auth header server-side.
      // API key never reaches the browser bundle; no CORS, no dotenv-expand issues.
      '/asaas-api': {
        target: asaasTarget,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/asaas-api/, '/api/v3'),
        secure: true,
        headers: {
          'access_token': asaasKey,
        },
      },
    },
  },
})
