import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import compression from 'vite-plugin-compression'
import Sitemap from 'vite-plugin-sitemap'
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MiB
        // ignore large files
        globIgnores: ['**/LLM.webworker-*.js', '**/vendor-webllm-*.js']
      },
      srcDir: 'src/services',          // where sw.ts lives
      filename: 'sw.ts',
      injectRegister: false,           // we register manually
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true, // enable service worker in dev
        suppressWarnings: true,
        type: 'module'
      },
      manifest: {
        name: 'Ivan Bandilla Portfolio',
        short_name: 'I Bandilla Portfolio',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f5f5',
        theme_color: '#72e3ad',
        icons: [] // add icons later
      }
    }),
    tailwindcss(),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
    Sitemap({
      hostname: 'http://localhost',
      dynamicRoutes: ['/', '/about', '/contact'],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep React ecosystem together - include all React-related packages
          'vendor-react': ['react', 'react-dom', 'react/jsx-runtime', 'react-router', 'react-router-dom'],

          // Large libraries that depend on React should reference it correctly
          'vendor-animation': ['framer-motion'],
          'vendor-editor': ['@tiptap/react', '@tiptap/core', '@tiptap/starter-kit', '@tiptap/extension-highlight'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-ui': ['@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card', '@radix-ui/react-label'],
          'vendor-webllm': ['@mlc-ai/web-llm'],
          'vendor-misc': ['bad-words', 'lovefield'],
          'vendor-icons': ['lucide-react'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})