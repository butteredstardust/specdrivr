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
        // iOS System Blue
        'ios-blue': '#007AFF',
        'ios-blue-dark': '#0056B3',

        // iOS System Gray (grayscale for semantic elements)
        'ios-gray': '#8E8E93',
        'ios-gray-2': '#AEAEB2',
        'ios-gray-3': '#C7C7CC',
        'ios-gray-4': '#D1D1D6',
        'ios-gray-5': '#E5E5EA',
        'ios-gray-6': '#F2F2F7',

        // iOS Text
        'ios-label': '#000000',
        'ios-secondary-label': '#3C3C4399',
        'ios-tertiary-label': '#3C3C4366',

        // iOS Background
        'ios-system-background': '#FFFFFF',
        'ios-secondary-system-background': '#F2F2F7',
        'ios-tertiary-system-background': '#FFFFFF',
        'ios-grouped-background': '#F2F2F7',

        // iOS Separator
        'ios-separator': '#C6C6C8',
        'ios-separator-opaque': '#38383A',

        // iOS Semantic
        'ios-green': '#34C759',
        'ios-red': '#FF3B30',
        'ios-orange': '#FF9500',
        'ios-yellow': '#FFCC00',

        // Legacy semantic colors (using variables)
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border-primary': 'var(--border-primary)',
      },
      fontSize: {
        // iOS Typography Scale (SF Pro approximation)
        'ios-large-title': ['34px', { lineHeight: '41px', fontWeight: '700' }],
        'ios-title-1': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'ios-title-2': ['22px', { lineHeight: '28px', fontWeight: '700' }],
        'ios-title-3': ['20px', { lineHeight: '25px', fontWeight: '700' }],
        'ios-headline': ['17px', { lineHeight: '22px', fontWeight: '600' }],
        'ios-body': ['17px', { lineHeight: '22px', fontWeight: '400' }],
        'ios-callout': ['16px', { lineHeight: '21px', fontWeight: '400' }],
        'ios-subheadline': ['15px', { lineHeight: '20px', fontWeight: '400' }],
        'ios-footnote': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'ios-caption-1': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'ios-caption-2': ['11px', { lineHeight: '13px', fontWeight: '400' }],
      },
      borderRadius: {
        'ios-sm': '8px',
        'ios-md': '12px',
        'ios-lg': '14px',
        'ios-xl': '16px',
      },
      boxShadow: {
        'ios-card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'ios-elevated': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'ios-modal': '0 20px 40px rgba(0, 0, 0, 0.2)',
      },
      backdropBlur: {
        'ios': '20px',
      },
    },
  },
  plugins: [],
}
