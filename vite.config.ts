import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import compression from 'vite-plugin-compression'
import Sitemap from 'vite-plugin-sitemap'

export default defineConfig({
  plugins: [
    react(),
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