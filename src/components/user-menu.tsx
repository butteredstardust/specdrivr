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
        // Try auto-login
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
      <div className="flex items-center gap-2 h-10 px-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="w-20 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
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
          'flex items-center gap-3 px-3 py-2 rounded-lg',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'transition-colors',
          isOpen && 'bg-gray-100 dark:bg-gray-800'
        )}
      >
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {user.username}
          </div>
          {user.isAdmin && (
            <div className="text-xs text-purple-600 dark:text-purple-400">
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
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.username}
              </div>
              {user.isAdmin && (
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  Administrator
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
