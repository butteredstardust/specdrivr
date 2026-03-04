/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light theme colors
        'bg-light': '#ffffff',
        'bg-light-secondary': '#f9fafb',
        'text-light-primary': '#111827',
        'text-light-secondary': '#6b7280',
        'border-light': '#e5e7eb',

        // Dark theme colors
        'bg-dark': '#111827',
        'bg-dark-secondary': '#1f2937',
        'text-dark-primary': '#f9fafb',
        'text-dark-secondary': '#9ca3af',
        'border-dark': '#374151',

        // Semantic colors using CSS variables
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border-primary': 'var(--border-primary)',
      },
    },
  },
  plugins: [],
}
