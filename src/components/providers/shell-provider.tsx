'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export type ShellContextType = {
  activeProjectId: string | null;
  setActiveProjectId: (id: string) => void;
  devMode: boolean;
  toggleDevMode: () => void;
  user: User | null;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
};

const ShellContext = createContext<ShellContextType | null>(null);

export function ShellProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  const router = useRouter();
  const [activeProjectId, _setActiveProjectId] = useState<string | null>(null);
  const [devMode, _setDevMode] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const firstKeyRef = useRef<string | null>(null);
  const keyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProject = localStorage.getItem('specdrivr:activeProjectId');
      if (storedProject) _setActiveProjectId(storedProject);

      const storedDevMode = localStorage.getItem('specdrivr:devMode');
      if (storedDevMode === 'true') _setDevMode(true);
    }
  }, []);

  const setActiveProjectId = (id: string) => {
    _setActiveProjectId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('specdrivr:activeProjectId', id);
    }
  };

  const toggleDevMode = () => {
    _setDevMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('specdrivr:devMode', next.toString());
      }
      return next;
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Global shortcuts
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        toggleDevMode();
        return;
      }

      if (e.key === 'Escape') {
        setShortcutsOpen(false);
        return;
      }

      // Input-guarded shortcuts
      if (!inInput) {
        if (e.key === '?') {
          e.preventDefault();
          setShortcutsOpen(true);
          return;
        }

        // Sequences
        if (firstKeyRef.current === 'g') {
          if (e.key === 'm') {
            e.preventDefault();
            router.push('/');
          } else if (e.key === 's') {
            e.preventDefault();
            router.push('/specs');
          } else if (e.key === 'a') {
            e.preventDefault();
            router.push('/sessions');
          }
          firstKeyRef.current = null;
          if (keyTimeoutRef.current) clearTimeout(keyTimeoutRef.current);
          return;
        }

        if (e.key === 'g') {
          firstKeyRef.current = 'g';
          if (keyTimeoutRef.current) clearTimeout(keyTimeoutRef.current);
          keyTimeoutRef.current = setTimeout(() => {
            firstKeyRef.current = null;
          }, 500);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (keyTimeoutRef.current) clearTimeout(keyTimeoutRef.current);
    };
  }, [router]);

  return (
    <ShellContext.Provider
      value={{
        activeProjectId,
        setActiveProjectId,
        devMode,
        toggleDevMode,
        user,
        shortcutsOpen,
        setShortcutsOpen,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

export function useShell() {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error('useShell must be used within a ShellProvider');
  }
  return context;
}
