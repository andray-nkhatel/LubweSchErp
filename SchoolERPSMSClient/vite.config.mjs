import { fileURLToPath, URL } from 'node:url';

import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    css: {
        preprocessorOptions: {
            sass: {
                // Silence Dart Sass legacy JS API deprecation (Vite still uses it)
                silenceDeprecations: ['legacy-js-api']
            }
        }
    },
    optimizeDeps: {
        noDiscovery: true,
         // Include jQuery to ensure proper loading
        include: ['jquery']
    },
    plugins: [
        vue(),
        Components({
            resolvers: [PrimeVueResolver()],
            // Limit directory scanning to prevent hangs
            dirs: ['src/components', 'src/views'],
            // Exclude node_modules and dist
            exclude: [/node_modules/, /dist/]
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
     // Define global variables for external libraries
  define: {
    global: 'globalThis',
  },
  // Development server proxy to bypass CORS issues
  // To use proxy: set VITE_API_BASE_URL=/api in .env.local
  // For local Docker API set target to http://localhost:8080; for remote use full URL
  server: {
    proxy: {
      '/api': {
        target: 'https://bluebirdhub.somee.com',
        changeOrigin: true,
        secure: true,
        // Don't rewrite - keep /api in the path
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url, '->', proxyReq.path);
          });
        }
      }
    }
  },
  // Ensure external scripts load properly
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Set sourcemap to false for faster builds
    sourcemap: false,
    rollupOptions: {
      external: ['jquery'],
      output: {
        globals: {
          jquery: 'jQuery'
        },
        // Optimize chunk splitting to reduce memory usage
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('vue-router') || id.includes('vuex')) {
              return 'vendor-vue';
            }
            if (id.includes('primevue') || id.includes('primeicons')) {
              return 'vendor-primevue';
            }
            if (id.includes('axios') || id.includes('chart.js') || id.includes('dayjs')) {
              return 'vendor-utils';
            }
            return 'vendor-other';
          }
        }
      }
    }
  }
});
