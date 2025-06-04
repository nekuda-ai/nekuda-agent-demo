/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // Scan all relevant files in src
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Example: Using Inter as primary sans-serif font
            },
            colors: {
                // Example custom colors - align with your branding
                primary: {
                    light: '#67e8f9', // cyan-300
                    DEFAULT: '#06b6d4', // cyan-500
                    dark: '#0e7490', // cyan-700
                },
                secondary: {
                    light: '#f9a8d4', // pink-300
                    DEFAULT: '#ec4899', // pink-500
                    dark: '#be185d', // pink-700
                }
            },
            animation: {
                bounce: 'bounce 1s infinite', // Default bounce is fine
                ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite', // Default ping is fine
                // Add custom animations if needed
            },
            keyframes: {
                // Define custom keyframes if needed for new animations
            }
        },
    },
    plugins: [
        // require('@tailwindcss/forms'), // Uncomment if you need form styling reset/enhancements
        // require('@tailwindcss/typography'), // Uncomment for prose styling
        // require('@tailwindcss/aspect-ratio'), // Uncomment for aspect ratio utilities
    ],
} 