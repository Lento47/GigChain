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
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          thirdweb: ['@thirdweb-dev/react', '@thirdweb-dev/sdk']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      '@thirdweb-dev/react',
      '@thirdweb-dev/sdk',
      '@thirdweb-dev/chains',
      'buffer',
      'process',
      'stream-browserify',
      'util'
    ],
    exclude: [
      'thirdweb-dev-wallets-evm-connectors-phantom'
    ]
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      stream: 'stream-browserify',
      util: 'util',
      crypto: 'crypto-browserify',
      os: 'os-browserify/browser',
      path: 'path-browserify',
      fs: false,
      net: false,
      tls: false
    }
  }
})
