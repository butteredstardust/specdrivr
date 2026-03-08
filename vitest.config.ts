import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        alias: {
            '@': path.resolve(__dirname, './src'),
            'next/server': 'next/dist/server/web/exports/index.js'
        },
        include: ['tests/unit/**/*.test.{ts,tsx}'],
        exclude: ['**/node_modules/**', '**/dist/**'],
    },
});
