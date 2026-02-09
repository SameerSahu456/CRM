import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3002',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Optimize chunk splitting for better caching and parallel loading
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunks
              'react-vendor': ['react', 'react-dom'],
              'charts': ['recharts'],
              'three-vendor': ['three', '@react-three/fiber', 'three-stdlib', 'camera-controls'],
              'shader-gradient': ['@shadergradient/react'],
              'icons': ['lucide-react'],
            },
          },
        },
        // Increase chunk size warning limit (we've optimized splitting)
        chunkSizeWarningLimit: 800,
        // Enable minification and tree-shaking (esbuild is faster than terser)
        minify: 'esbuild',
        // Optimize assets
        assetsInlineLimit: 4096, // Inline assets < 4kb
        cssCodeSplit: true,
        sourcemap: false, // Disable sourcemaps for smaller builds
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'three', '@react-three/fiber'],
        exclude: ['@shadergradient/react'], // Don't pre-bundle heavy deps
        esbuildOptions: {
          target: 'esnext',
        },
      },
    };
});
