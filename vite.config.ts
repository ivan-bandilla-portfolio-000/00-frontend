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
        enabled: false, // enable service worker in dev
        suppressWarnings: false,
        type: 'module'
      },
      manifest: {
        id: '/',
        name: 'Ivan Bandilla Portfolio',
        short_name: 'IB Portfolio',
        start_url: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay'],
        background_color: '#f5f5f5',
        theme_color: '#72e3ad',
        "icons": [
          { "src": "/assets/icons/manifest-icon-192.maskable.webp", "sizes": "192x192", "type": "image/webp", "purpose": "any" },
          { "src": "/assets/icons/manifest-icon-192.maskable.webp", "sizes": "192x192", "type": "image/webp", "purpose": "maskable" },
          { "src": "/assets/icons/manifest-icon-512.maskable.webp", "sizes": "512x512", "type": "image/webp", "purpose": "any" },
          { "src": "/assets/icons/manifest-icon-512.maskable.webp", "sizes": "512x512", "type": "image/webp", "purpose": "maskable" }
        ],
        screenshots: [
          {
            src: '/assets/screenshot_wide.webp',
            sizes: '1920x953',
            type: 'image/webp',
            form_factor: 'wide'
          },
          {
            src: '/assets/screenshot_narrow.jpg',
            sizes: '480x1030',
            type: 'image/jpeg'
          }
        ],
        shortcuts: [
          {
            name: 'Open Home',
            short_name: 'Home',
            description: 'Open the portfolio home',
            url: '/',
            icons: [{ src: '/assets/icons/manifest-icon-192.maskable.webp', sizes: '192x192', type: 'image/webp', purpose: 'maskable' }]
          },
          {
            name: 'About',
            short_name: 'About',
            description: 'Learn more about me',
            url: '/about',
            icons: [{ src: '/assets/icons/manifest-icon-192.maskable.webp', sizes: '192x192', type: 'image/webp' }]
          },
          {
            name: 'Contact',
            short_name: 'Contact',
            description: 'Get in touch',
            url: '/contact',
            icons: [{ src: '/assets/icons/manifest-icon-192.maskable.webp', sizes: '192x192', type: 'image/webp' }]
          }
        ],
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