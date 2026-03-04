'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
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
    // Icon-only version with gradient background
    return (
      <div
        className={cn(
          sizeClass,
          'rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-sm',
          className
        )}
        aria-label="Spec-Drivr Logo"
      >
        sd
      </div>
    );
  }

  // Full logo with text
  return (
    <div className={cn('flex items-center pl-2.5', className)}>
      <span className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent tracking-tight lowercase">
        specdrivr
      </span>
    </div>
  );
}