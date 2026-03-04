'use client';

import { cn } from '@/lib/utils';

interface AvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  userId?: number;
  avatarId?: number;
  username?: string;
  avatarUrl?: string;
  className?: string;
}

// 10 default avatar emojis with themes
const DEFAULT_AVATARS = [
  { id: 1, emoji: '👨‍💻', theme: 'Tech' },
  { id: 2, emoji: '👩‍💻', theme: 'Tech 2' },
  { id: 3, emoji: '🦸', theme: 'Hero' },
  { id: 4, emoji: '🧙', theme: 'Wizard' },
  { id: 5, emoji: '🧑‍🚀', theme: 'Space' },
  { id: 6, emoji: '🕵️', theme: 'Detective' },
  { id: 7, emoji: '👨‍🎨', theme: 'Creative' },
  { id: 8, emoji: '👩‍🏫', theme: 'Teacher' },
  { id: 9, emoji: '👨‍🏭', theme: 'Engineer' },
  { id: 10, emoji: '🧑‍💼', theme: 'Business' },
];

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

export function Avatar({
  size = 'md',
  avatarId = 1,
  username,
  avatarUrl,
  className
}: AvatarProps) {
  const sizeClass = sizeClasses[size];

  // If custom avatar URL is provided, use it
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username || 'User avatar'}
        className={cn(
          'rounded-full object-cover',
          sizeClass,
          className
        )}
      />
    );
  }

  // Use default avatar emoji
  const avatar = DEFAULT_AVATARS[Math.min(avatarId - 1, DEFAULT_AVATARS.length - 1)] || DEFAULT_AVATARS[0];

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-700/50',
        sizeClass,
        className
      )}
      title={username ? `${username} - ${avatar.theme}` : avatar.theme}
    >
      <span className="select-none">{avatar.emoji}</span>
    </div>
  );
}

export function AvatarPicker({
  selectedId = 1,
  onSelect,
}: {
  selectedId?: number;
  onSelect: (avatarId: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {DEFAULT_AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          onClick={() => onSelect(avatar.id)}
          className={`
            flex items-center justify-center w-12 h-12 rounded-lg transition-all
            hover:scale-110 hover:shadow-lg
            ${selectedId === avatar.id
              ? 'ring-2 ring-purple-500 ring-offset-2 bg-purple-50 dark:bg-purple-900/30'
              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
          title={avatar.theme}
        >
          <span className="text-2xl select-none">{avatar.emoji}</span>
        </button>
      ))}
    </div>
  );
}
