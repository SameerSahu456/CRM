import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // API backend URL - configurable via VITE_API_URL env var
  const apiTarget = env.VITE_API_URL || 'http://localhost:3002';

  return {
    root: '.', // frontend directory is the root
    publicDir: 'public',
    server: {
      port: 5199,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiTarget,
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
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      outDir: '../dist', // Build output relative to frontend/
      emptyOutDir: true,
      // Optimize chunk splitting for better caching and parallel loading
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
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

