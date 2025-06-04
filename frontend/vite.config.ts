import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
    },
    // To handle JSON imports like the Lottie animation
    assetsInclude: ['**/*.json'],
}); 