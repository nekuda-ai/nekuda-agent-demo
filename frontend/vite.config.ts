import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    envDir: '../',
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
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        rollupOptions: {
            onwarn(warning, warn) {
                // Suppress certain warnings
                if (warning.code === 'CIRCULAR_DEPENDENCY') return;
                if (warning.code === 'THIS_IS_UNDEFINED') return;
                warn(warning);
            }
        }
    },
    define: {
        global: 'globalThis',
    },
    optimizeDeps: {
        exclude: ['react-svg-credit-card-payment-icons']
    },
    resolve: {
        alias: {
            'react-svg-credit-card-payment-icons': path.resolve(__dirname, 'src/stubs/react-svg-credit-card-payment-icons.js')
        }
    }
}); 