'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PixelDropdown } from '@pxlkit/ui-kit';
import { useShell } from '@/components/providers/shell-provider';
import { authClient } from '@/lib/auth-client';

export function UserMenu() {
  const router = useRouter();
  const { user, setShortcutsOpen } = useShell();

  if (!user) {
    return null;
  }

  // Fallback to shadcn if PixelDropdown does not support divider items gracefully
  // But attempting PixelDropdown first per spec
  return (
    <PixelDropdown
      label={user.name}
      items={[
        { value: 'profile', label: 'Profile Settings' },
        { value: 'security', label: 'Security' },
        { value: 'notifications', label: 'Notifications' },
        { value: '__divider__', label: '---' },
        { value: 'shortcuts', label: 'Keyboard Shortcuts' },
        { value: '__divider2__', label: '---' },
        { value: 'signout', label: 'Sign Out' },
      ]}
      onSelect={async (value) => {
        if (value.startsWith('__divider')) return;

        if (value === 'signout') {
          await authClient.signOut();
          router.push('/login');
          return;
        }

        if (value === 'shortcuts') {
          setShortcutsOpen(true);
          return;
        }

        router.push(`/settings/${value}`);
      }}
    />
  );
}
