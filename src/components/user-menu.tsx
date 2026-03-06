'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar } from './avatar';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';

interface User {
  id: number;
  username: string;
  avatarId: number;
  avatarUrl: string | null;
  isAdmin: boolean;
}

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        await fetch('/api/auth/auto-login');
        const autoResponse = await fetch('/api/auth/session');
        const autoData = await autoResponse.json();
        if (autoData.success && autoData.user) {
          setUser(autoData.user);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="w-[32px] h-[32px] rounded-full bg-white/20 animate-pulse" />
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-[32px] h-[32px] rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 text-white text-[12px] font-semibold transition-colors',
          isOpen && 'bg-white/30'
        )}
      >
        <span className="uppercase">{user.username.charAt(0)}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-[var(--sp-2)] w-56 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-overlay)] z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-[var(--sp-4)] py-[var(--sp-3)] border-b border-[var(--border-default)]">
              <div className="text-[14px] font-semibold text-[var(--text-primary)]">
                {user.username}
              </div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                {user.isAdmin ? 'Administrator' : 'Viewer'}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full px-[var(--sp-4)] py-[var(--sp-3)] text-left text-[13px] text-[var(--status-blocked-text)] hover:bg-[var(--bg-hovered)] transition-colors flex items-center gap-[var(--sp-2)]"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
