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
      window.location.reload();
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
    return null;
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
