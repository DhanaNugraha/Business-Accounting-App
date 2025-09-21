/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: 'react',
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
        ],
      },
    }),
    tsconfigPaths(),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Add polyfills for Node.js built-ins
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'util': 'util',
      'buffer': 'buffer',
      'process': 'process/browser',
      'path': 'path-browserify',
    },
  },
  
  // Server configuration for local development
  server: {
    port: 3000,
    open: true,
    proxy: {
      // In development, proxy API requests to the local backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
  // Preview configuration (used by 'vite preview' command)
  preview: {
    port: 3000,
    strictPort: true,
    proxy: {
      // In preview mode, proxy API requests to the production backend
      '/api': {
        target: 'https://your-render-backend.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true,
    // Disable inlining to ensure files are served with correct MIME types
    assetsInlineLimit: 0,
    // Ensure proper module type
    manifest: true,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          vendor: ['axios', 'date-fns', 'react-datepicker'],
        },
        // Simple and consistent file naming
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  
  define: {
    'process.env': {},
    'process.browser': true,
    global: 'globalThis',
  },
  
  // Base URL configuration for Vercel - use relative paths
  base: '',
});
