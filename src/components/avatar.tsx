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

const DEFAULT_AVATARS = [
  { id: 1, emoji: '👨‍💻' },
  { id: 2, emoji: '👩‍💻' },
  { id: 3, emoji: '🦸' },
  { id: 4, emoji: '🧙' },
  { id: 5, emoji: '🧑‍🚀' },
  { id: 6, emoji: '🕵️' },
  { id: 7, emoji: '👨‍🎨' },
  { id: 8, emoji: '👩‍🏫' },
  { id: 9, emoji: '👨‍🏭' },
  { id: 10, emoji: '🧑‍💼' },
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

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username || 'User avatar'}
        className={cn('rounded-full object-cover', sizeClass, className)}
      />
    );
  }

  const avatar = DEFAULT_AVATARS[Math.min(avatarId - 1, DEFAULT_AVATARS.length - 1)] || DEFAULT_AVATARS[0];

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border',
        sizeClass,
        'bg-ios-secondary border-opacity-20',
        className
      )}
      title={username || avatar.id.toString()}
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
    <div className="grid grid-cols-5 gap-3 ios-font">
      {DEFAULT_AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          onClick={() => onSelect(avatar.id)}
          className={`
            flex items-center justify-center w-12 h-12 ios-radius transition-all duration-200
            hover:scale-105
            ${selectedId === avatar.id
              ? 'ring-2 ring-[var(--ios-blue)] bg-ios-secondary'
              : 'bg-ios-secondary hover:bg-opacity-80'
            }
          `}
          title={`Avatar ${avatar.id}`}
        >
          <span className="text-2xl select-none">{avatar.emoji}</span>
        </button>
      ))}
    </div>
  );
}
