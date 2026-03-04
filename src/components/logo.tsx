'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'icon' | 'small' | 'medium' | 'large';
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  icon: 'w-8 h-8',
  small: 'w-10 h-10',
  medium: 'w-40 h-12',
  large: 'w-56 h-16',
};

export function Logo({ size = 'medium', className, showText = true }: LogoProps) {
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
    <div className={cn('flex items-center', className)}>
      <div
        className={cn(
          sizeClass,
          'rounded-lg bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 flex items-center justify-center font-bold text-white mr-3'
        )}
      >
        <span className="text-2xl tracking-tight">sd</span>
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent tracking-tight lowercase">
          specdrivr
        </span>
        <span className="text-sm text-gray-600 font-medium">AI Agent Platform</span>
      </div>
    </div>
  );
}