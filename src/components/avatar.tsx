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

const sizeClasses = {
  xs: 'w-[24px] h-[24px] text-[var(--font-size-xs)]',
  sm: 'w-[28px] h-[28px] text-[var(--font-size-xs)]',
  md: 'w-[32px] h-[32px] text-[var(--font-size-sm)]',
  lg: 'w-[40px] h-[40px] text-[var(--font-size-base)]',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

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

  const initials = username ? getInitials(username) : String.fromCharCode(65 + ((avatarId - 1) % 26));

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold',
        sizeClass,
        'bg-[var(--color-brand-subtle)] text-[var(--color-brand-bold)]',
        className
      )}
      title={username || `User ${avatarId}`}
    >
      <span className="select-none uppercase">{initials}</span>
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
  const avatarLetters = Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="grid grid-cols-5 gap-[var(--sp-3)]">
      {avatarLetters.map((letter, index) => {
        const id = index + 1;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={cn(
              'flex items-center justify-center w-[40px] h-[40px] rounded-full transition-all',
              'hover:scale-105',
              selectedId === id
                ? 'ring-2 ring-[var(--color-brand-bold)] bg-[var(--color-brand-subtle)]'
                : 'bg-[var(--color-bg-sunken)] hover:bg-[var(--color-bg-hovered)]'
            )}
            title={`Avatar ${id}`}
          >
            <span className="text-[var(--font-size-base)] font-semibold select-none text-[var(--color-brand-bold)]">
              {letter}
            </span>
          </button>
        );
      })}
    </div>
  );
}
