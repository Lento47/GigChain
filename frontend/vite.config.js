import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
          thirdweb: ['thirdweb']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'thirdweb',
      'thirdweb/react',
      'thirdweb/chains',
      'thirdweb/wallets',
      'buffer',
      'process',
      'stream-browserify',
      'util'
    ]
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.version': JSON.stringify(process.version || ''),
    'process.browser': true
  },
  resolve: {
    alias: {
      // Path aliases for cleaner imports
      '@': path.resolve(__dirname, './src'),
      '@views': path.resolve(__dirname, './src/views'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@styles': path.resolve(__dirname, './src/styles'),
      // Node polyfills for browser compatibility
      buffer: 'buffer',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      path: 'path-browserify',
      os: 'os-browserify',
      util: 'util',
      process: 'process/browser',
      // Disable node modules that shouldn't be used in browser
      fs: false,
      net: false,
      tls: false,
      child_process: false
    }
  }
})
