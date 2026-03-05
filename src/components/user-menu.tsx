'use client';

import { useState, useEffect } from 'react';
import { Avatar } from './avatar';
import { cn } from '@/lib/utils';

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
      // Check API session first
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
      } else {
        // Try auto-login API
        try {
          await fetch('/api/auth/auto-login');
          const autoResponse = await fetch('/api/auth/session');
          const autoData = await autoResponse.json();
          if (autoData.success && autoData.user) {
            setUser(autoData.user);
          } else {
            // Fall back to localStorage (demo auth)
            const session = localStorage.getItem('specdrivr_session');
            if (session) {
              const sessionData = JSON.parse(session);
              setUser({
                id: 1,
                username: sessionData.username || 'Demo User',
                avatarId: 1,
                avatarUrl: null,
                isAdmin: true,
              });
            }
          }
        } catch {
          // Fall back to localStorage (demo auth)
          const localSession = localStorage.getItem('specdrivr_session');
          if (localSession) {
            const sessionData = JSON.parse(localSession);
            setUser({
              id: 1,
              username: sessionData.username || 'Demo User',
              avatarId: 1,
              avatarUrl: null,
              isAdmin: true,
            });
          }
        }
      }
    } catch (error) {
      // Fall back to localStorage on API failure
      try {
        const session = localStorage.getItem('specdrivr_session');
        if (session) {
          const sessionData = JSON.parse(session);
          setUser({
            id: 1,
            username: sessionData.username || 'Demo User',
            avatarId: 1,
            avatarUrl: null,
            isAdmin: true,
          });
        }
      } catch {
        console.error('Failed to fetch user:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear localStorage session (demo auth)
      localStorage.removeItem('specdrivr_session');

      // Also try API logout if available
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // API might not exist, ignore
      }

      setUser(null);
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 h-10 px-3">
        <div className="w-8 h-8 rounded-full bg-ios-secondary animate-pulse" />
        <div className="w-16 h-4 ios-radius-small bg-ios-secondary animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <a
        href="/auth/login"
        className="ios-button-primary px-4 py-2 text-sm"
      >
        Sign In
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 ios-radius transition-colors',
          'hover:bg-ios-secondary bg-opacity-50',
          isOpen && 'bg-ios-secondary'
        )}
      >
        <div className="text-right hidden sm:block ios-font-text">
          <div className="text-[17px] font-medium text-ios-primary">
            {user.username}
          </div>
          {user.isAdmin && (
            <div className="text-[13px] text-ios-placeholder">
              Admin
            </div>
          )}
        </div>
        <Avatar
          size="sm"
          avatarId={user.avatarId}
          avatarUrl={user.avatarUrl || undefined}
          username={user.username}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-56 ios-card shadow-lg border ios-font-text z-20 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-opacity-12" style={{ borderColor: 'var(--ios-separator)' }}>
              <div className="text-[17px] font-semibold text-ios-primary">
                {user.username}
              </div>
              {user.isAdmin && (
                <div className="text-[15px] text-ios-placeholder mt-0.5">
                  Administrator
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-[13px] text-left text-[17px] text-ios-red hover:bg-opacity-10 hover:bg-ios-secondary transition-colors flex items-center gap-2"
            >
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
