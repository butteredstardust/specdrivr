'use client';

import { cn } from '@/lib/utils';

export interface LogoProps {
  size?: 'icon' | 'small' | 'medium' | 'large';
  className?: string;
}

const sizeClasses = {
  icon: 'w-8 h-8',
  small: 'w-10 h-10',
  medium: 'w-40 h-12',
  large: 'w-56 h-16',
};

export function Logo({ size = 'medium', className }: LogoProps) {
  const sizeClass = sizeClasses[size];

  if (size === 'icon' || size === 'small') {
    return (
      <div
        className={cn(
          sizeClass,
          'rounded-[var(--radius-md)] bg-[var(--color-brand-bold)] flex items-center justify-center font-bold text-white text-[var(--font-size-xs)]',
          className
        )}
        aria-label="specdrivr Logo"
      >
        SD
      </div>
    );
  }

  // Full logo with text
  return (
    <div className={cn('flex items-center pl-[var(--sp-2)]', className)}>
      <span className="text-[var(--font-size-lg)] font-bold text-[var(--color-brand-bold)] tracking-tight lowercase">
        specdrivr
      </span>
    </div>
  );
}