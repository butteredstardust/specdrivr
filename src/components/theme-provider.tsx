'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<string>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load theme from localStorage after component mounts (client-side only)
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Apply theme to document element
    const root = document.documentElement;
    console.log('Setting theme to:', theme, 'dark class present:', root.classList.contains('dark'));

    if (theme === 'dark') {
      root.classList.add('dark');
      console.log('Added dark class, now contains:', root.classList.contains('dark'));
    } else {
      root.classList.remove('dark');
      console.log('Removed dark class, now contains:', root.classList.contains('dark'));
    }
    // Persist to localStorage
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
