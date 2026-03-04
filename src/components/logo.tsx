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
  medium: 'w-32 h-12',
  large: 'w-48 h-16',
};

export function Logo({ size = 'medium', className, showText = true }: LogoProps) {
  const sizeClass = sizeClasses[size];

  if (size === 'icon' || size === 'small') {
    // Icon-only version (no text)
    return (
      <svg
        className={cn(sizeClass, className)}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Spec-Drivr Logo"
      >
        {/* Gear background */}
        <path
          d="M24 4L26.8 10.5L33.5 10.5L28.9 14.8L31.7 21.3L26.1 17L20.5 21.3L23.3 14.8L18.7 10.5L25.4 10.5L24 4Z"
          fill="#3B82F6"
          opacity="0.3"
        />
        <path
          d="M24 44L26.8 37.5L33.5 37.5L28.9 33.2L31.7 26.7L26.1 31L20.5 26.7L23.3 33.2L18.7 37.5L25.4 37.5L24 44Z"
          fill="#3B82F6"
          opacity="0.3"
        />
        <circle cx="24" cy="24" r="8" fill="#3B82F6" opacity="0.8" />

        {/* Circuit/AI pattern */}
        <circle cx="24" cy="24" r="4" fill="#1E40AF" />
        <path d="M24 20L24 16M24 28L24 32M20 24L16 24M28 24L32 24" stroke="#1E40AF" strokeWidth="1" />
        <circle cx="24" cy="16" r="1" fill="#1E40AF" />
        <circle cx="24" cy="32" r="1" fill="#1E40AF" />
        <circle cx="16" cy="24" r="1" fill="#1E40AF" />
        <circle cx="32" cy="24" r="1" fill="#1E40AF" />
      </svg>
    );
  }

  // Full logo with text
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        className={cn(sizeClass)}
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Spec-Drivr Logo"
      >
        {/* Icon */}
        <g transform="translate(10, 15)">
          {/* Gear background */}
          <path
            d="M20 0L22.8 6.5L29.5 6.5L24.9 10.8L27.7 17.3L22.1 13L16.5 17.3L19.3 10.8L14.7 6.5L21.4 6.5L20 0Z"
            fill="#3B82F6"
            opacity="0.3"
          />
          <path
            d="M20 40L22.8 33.5L29.5 33.5L24.9 29.2L27.7 22.7L22.1 27L16.5 22.7L19.3 29.2L14.7 33.5L21.4 33.5L20 40Z"
            fill="#3B82F6"
            opacity="0.3"
          />
          <circle cx="20" cy="20" r="8" fill="#3B82F6" opacity="0.8" />

          {/* Circuit/AI pattern */}
          <circle cx="20" cy="20" r="4" fill="#1E40AF" />
          <path d="M20 16L20 12M20 24L20 28M16 20L12 20M24 20L28 20" stroke="#1E40AF" strokeWidth="1" />
          <circle cx="20" cy="12" r="1" fill="#1E40AF" />
          <circle cx="20" cy="28" r="1" fill="#1E40AF" />
          <circle cx="12" cy="20" r="1" fill="#1E40AF" />
          <circle cx="28" cy="20" r="1" fill="#1E40AF" />
        </g>

        {/* Text: Spec-Drivr */}
        <text x="55" y="35" fontFamily="ui-sans-serif, system-ui, -apple-system" fontSize="22" fontWeight="700" fill="#1F2937">
          Spec-Drivr
        </text>

        {/* Subtitle: AI Agent Development Platform */}
        <text x="55" y="50" fontFamily="ui-sans-serif, system-ui, -apple-system" fontSize="10" fontWeight="500" fill="#6B7280">
          AI Agent Development Platform
        </text>
      </svg>
    </div>
  );
}