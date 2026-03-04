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
        'flex items-center justify-center rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#C6C6C829] dark:border-[#38383A52]',
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
    <div className="grid grid-cols-5 gap-3">
      {DEFAULT_AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          onClick={() => onSelect(avatar.id)}
          className={`
            flex items-center justify-center w-12 h-12 rounded-[12px] transition-all
            hover:scale-105
            ${selectedId === avatar.id
              ? 'ring-2 ring-[#007AFF] bg-[#F2F2F7] dark:bg-[#2C2C2E]'
              : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]'
            }
          `}
          title={avatar.theme}
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}
        >
          <span className="text-2xl select-none">{avatar.emoji}</span>
        </button>
      ))}
    </div>
  );
}
