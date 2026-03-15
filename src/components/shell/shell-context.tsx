'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ShellContextValue {
  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;
  devMode: boolean;
  setDevMode: (v: boolean) => void;
  user: { id: string; name: string; email: string; role?: string; onboardingStep?: number };
  shortcutsOpen: boolean;
  setShortcutsOpen: (v: boolean) => void;
}

interface ShellProviderProps {
  user: ShellContextValue['user'];
  children: React.ReactNode;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ user, children }: ShellProviderProps) {
  const router = useRouter();
  const [activeProjectId, setActiveProjectIdState] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('specdrivr:activeProjectId');
    return stored ? parseInt(stored, 10) : null;
  });
  const [devMode, setDevModeState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('specdrivr:devMode') === 'true';
  });
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const firstKeyRef = useRef<string | null>(null);
  const firstKeyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveProjectId = useCallback((id: number | null) => {
    setActiveProjectIdState(id);
    if (id === null) localStorage.removeItem('specdrivr:activeProjectId');
    else localStorage.setItem('specdrivr:activeProjectId', String(id));
  }, []);

  const setDevMode = useCallback((v: boolean) => {
    setDevModeState(v);
    localStorage.setItem('specdrivr:devMode', String(v));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focused on input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable)
        return;

      // Escape
      if (e.key === 'Escape') {
        setShortcutsOpen(false);
        firstKeyRef.current = null;
        return;
      }

      // Ctrl+`
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setDevMode(!devMode);
        return;
      }

      // ?
      if (e.key === '?') {
        setShortcutsOpen(true);
        return;
      }

      // Two-key sequences: g+m, g+s, g+a
      if (firstKeyRef.current === 'g') {
        if (firstKeyTimerRef.current) clearTimeout(firstKeyTimerRef.current);
        firstKeyRef.current = null;
        if (e.key === 'm') {
          router.push('/');
          return;
        }
        if (e.key === 's') {
          router.push('/specs');
          return;
        }
        if (e.key === 'a') {
          router.push('/sessions');
          return;
        }
      }

      if (e.key === 'g') {
        firstKeyRef.current = 'g';
        firstKeyTimerRef.current = setTimeout(() => {
          firstKeyRef.current = null;
        }, 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (firstKeyTimerRef.current) {
        clearTimeout(firstKeyTimerRef.current);
        firstKeyTimerRef.current = null;
      }
    };
  }, [devMode, router, setDevMode]);

  return (
    <ShellContext.Provider
      value={{
        activeProjectId,
        setActiveProjectId,
        devMode,
        setDevMode,
        user,
        shortcutsOpen,
        setShortcutsOpen,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used within ShellProvider');
  return ctx;
}

export function useDevMode() {
  const { devMode, setDevMode } = useShell();
  return { devMode, toggleDevMode: () => setDevMode(!devMode) };
}
