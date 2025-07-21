import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    envDir: '../',
    resolve: {
        alias: {
            'react-svg-credit-card-payment-icons': path.resolve(__dirname, 'node_modules/react-svg-credit-card-payment-icons/dist/index.mjs')
        }
    },
    optimizeDeps: {
        exclude: [
            'react-svg-credit-card-payment-icons',
            'refractor',
            'character-entities',
            'character-entities-legacy',
            'character-entities-html4',
            'character-reference-invalid'
        ]
    },
    server: {
        port: 3000, // Specify port 3000 for dev server
        strictPort: true, // Exit if port is already in use
        // proxy: { // Optional: If you need to proxy backend requests during dev
        //   '/api': {
        //     target: 'http://localhost:8000', // Your chat service backend
        //     changeOrigin: true,
        //     rewrite: (path) => path.replace(/^\/api/, '')
        //   }
        // }
    },
    build: {
        outDir: 'build', // Output directory for production build (defaults to dist)
        rollupOptions: {
            external: (id) => {
                // Exclude unused transitive dependencies from @copilotkit/react-ui
                // that have corrupted JSON files and cause build failures
                // These come from react-syntax-highlighter which we don't use
                return id.includes('refractor') || 
                       id.includes('character-entities') || 
                       id.includes('character-reference-invalid') ||
                       id.includes('tr46') ||
                       id.includes('node-fetch') ||
                       id.includes('whatwg-url');
            }
        }
    },
    // To handle JSON imports like the Lottie animation
    assetsInclude: ['**/*.json'],
}); 