import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = command === 'build';

    return {
      plugins: [
        react({
          // JSX runtime for better performance
          jsxRuntime: 'automatic',
        })
      ],

      // Enhanced build optimization
      build: {
        // Enable source maps for production debugging
        sourcemap: isProduction ? 'hidden' : true,

        // Optimize chunk splitting
        rollupOptions: {
          output: {
            // Manual chunk splitting for better caching
            manualChunks: {
              // Vendor chunks for stable dependencies
              'react-vendor': ['react', 'react-dom'],
              'ui-vendor': ['lucide-react', '@radix-ui/react-slot'],
              'ai-vendor': ['@anthropic-ai/sdk', '@google/genai', 'openai'],
              'utils': ['markdown-it', 'lodash'],

              // Dynamic imports for lazy-loaded components
              'components': [
                './src/components/ApiKeyManager',
                './src/components/ContentNavigator',
                './src/components/CustomPromptsManager',
                './src/components/CharacterPanel',
                './src/components/StoryManager'
              ]
            },

            // Optimize chunk naming
            chunkFileNames: (chunkInfo) => {
              const facadeModuleId = chunkInfo.facadeModuleId ?
                chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') : 'chunk';
              return `js/${facadeModuleId}-[hash].js`;
            },

            // Optimize asset naming
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name!.split('.');
              const ext = info[info.length - 1];
              if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                return `images/[name]-[hash][extname]`;
              }
              if (/css/i.test(ext)) {
                return `styles/[name]-[hash][extname]`;
              }
              return `assets/[name]-[hash][extname]`;
            }
          }
        },

        // Increase chunk size warning limit for larger applications
        chunkSizeWarningLimit: 1000,

        // Enable minification
        minify: isProduction ? 'esbuild' : false,

        // Target modern browsers for better performance
        target: 'esnext',

        // CSS code splitting
        cssCodeSplit: true,

        // Enable tree shaking
        modulePreload: {
          polyfill: false
        }
      },

      // Enhanced dependency optimization
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          '@anthropic-ai/sdk',
          '@google/genai',
          'openai',
          'markdown-it'
        ],
        exclude: ['@vite/client', '@vite/env']
      },

      // Define global constants
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NODE_ENV': JSON.stringify(mode),
        __DEV__: !isProduction,
      },

      // Enhanced alias resolution
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '~': path.resolve(__dirname, '.'),
          'src': path.resolve(__dirname, './src'),
          'components': path.resolve(__dirname, './src/components'),
          'hooks': path.resolve(__dirname, './src/hooks'),
          'services': path.resolve(__dirname, './src/services'),
          'utils': path.resolve(__dirname, './src/utils'),
          'types': path.resolve(__dirname, './src/types'),
          'contexts': path.resolve(__dirname, './src/contexts'),
        }
      },

      // Development server optimization
      server: {
        // Enable HMR for better development experience
        hmr: {
          overlay: true,
        },

        // Optimize file watching
        watch: {
          usePolling: false,
          interval: 100,
        },

        // Proxy API calls if needed
        proxy: {
          // Add API proxies here if your backend is on a different port
          // '/api': 'http://localhost:3001'
        }
      },

      // Preview server for production testing
      preview: {
        port: 4173,
        host: true,
        cors: true,
      },

      // Enable CSS preprocessing
      css: {
        devSourcemap: true,
        postcss: './postcss.config.cjs',
      },

      // Performance optimizations
      esbuild: {
        // Remove console logs and debugger statements in production
        drop: isProduction ? ['console', 'debugger'] : [],

        // Enable JSX optimizations
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment',

        // Tree shaking optimizations
        treeShaking: true,
      }
    };
});
