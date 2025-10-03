import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  optimizeDeps: {
    include: [
      '@thirdweb-dev/react',
      '@thirdweb-dev/sdk',
      '@thirdweb-dev/chains'
    ],
    exclude: [
      'thirdweb-dev-wallets-evm-connectors-phantom'
    ]
  },
  define: {
    global: 'globalThis',
  }
})
