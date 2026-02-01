/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'material-bg': '#f8fafc',    // Slate 50
                'material-surface': '#ffffff',
                'material-border': '#e2e8f0', // Slate 200
                'material-text': '#0f172a',   // Slate 900
                'material-muted': '#64748b',  // Slate 500
                'material-primary': '#2563eb', // Blue 600
                'material-primary-hover': '#1d4ed8', // Blue 700
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            }
        },
    },
    plugins: [],
}
