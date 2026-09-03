import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Specdrivr',
    template: '%s · Specdrivr',
  },
  description: 'AI-native orchestration platform',
  applicationName: 'Specdrivr',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/brand/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/brand/icon.svg',
    apple: '/brand/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
          <NuqsAdapter>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className:
                  'font-mono text-xs border-border-default bg-bg-surface text-text-primary',
              }}
            />
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
