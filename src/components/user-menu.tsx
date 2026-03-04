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
      <div className="flex items-center gap-2.5 h-10 px-3">
        <div className="w-8 h-8 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] animate-pulse" />
        <div className="w-16 h-4 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E] animate-pulse" />
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
          'flex items-center gap-3 px-3 py-2 rounded-[12px]',
          'hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]',
          'transition-colors',
          isOpen && 'bg-[#F2F2F7] dark:bg-[#2C2C2E]'
        )}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}
      >
        <div className="text-right hidden sm:block">
          <div className="text-[17px] font-medium text-black dark:text-white">
            {user.username}
          </div>
          {user.isAdmin && (
            <div className="text-[13px] text-[#8E8E93]">
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
          <div
            className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1C1C1E] rounded-[12px] shadow-lg border border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)] py-1 z-20"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}
          >
            <div className="px-4 py-3 border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)]">
              <div className="text-[17px] font-semibold text-black dark:text-white">
                {user.username}
              </div>
              {user.isAdmin && (
                <div className="text-[15px] text-[#8E8E93] mt-0.5">
                  Administrator
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-[13px] text-left text-[17px] text-[#FF3B30] hover:bg-[#FF3B30]/[0.1] transition-colors flex items-center gap-2"
            >
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
