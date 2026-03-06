import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: "Spec-Drivr",
  description: "AI Agent Development Platform",
  icons: {
    icon: "/brand/icon.svg",
    shortcut: "/brand/icon.svg",
    apple: "/brand/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var theme = localStorage.getItem('theme') || 'light';
              if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            })();
          `
        }} />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
