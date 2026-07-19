/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                brand: {
                    50: '#f0f4ff',
                    100: '#dbe4ff',
                    200: '#bac8ff',
                    300: '#91a7ff',
                    400: '#748ffc',
                    500: '#5c7cfa',
                    600: '#4c6ef5',
                    700: '#4263eb',
                    800: '#3b5bdb',
                    900: '#364fc7',
                    950: '#1e3a8a',
                },
                surface: {
                    900: '#0a0f1e',
                    800: '#0d1426',
                    700: '#111827',
                    600: '#1a2236',
                    500: '#1e293b',
                    400: '#2d3748',
                },
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fadeIn 0.4s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'shimmer': 'shimmer 2s linear infinite',
                'spin-slow': 'spin 3s linear infinite',
                'bounce-dot': 'bounceDot 1.4s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
                slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
                glow: {
                    from: { boxShadow: '0 0 5px #4c6ef5, 0 0 10px #4c6ef5' },
                    to: { boxShadow: '0 0 20px #4c6ef5, 0 0 40px #4263eb' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                bounceDot: {
                    '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.3' },
                    '40%': { transform: 'scale(1)', opacity: '1' },
                },
            },
            backdropBlur: { xs: '2px' },
        },
    },
    plugins: [],
}
