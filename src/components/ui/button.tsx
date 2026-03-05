'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      loading = false,
      icon,
      iconRight,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center gap-[var(--sp-2)] font-medium rounded-[var(--radius-md)] transition-[background,color] disabled:opacity-50 disabled:cursor-not-allowed outline-none border-none cursor-pointer text-[12px]';

    const variantClasses = {
      primary: 'bg-[var(--color-brand-bold)] text-white hover:bg-[var(--color-brand-bolder)]',
      secondary: 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hovered)] hover:border-[var(--color-border-bold)] border-solid',
      danger: 'bg-[#CA3521] text-white hover:bg-[var(--color-text-danger)]',
      ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hovered)] hover:text-[var(--color-text-primary)]',
    };

    const sizeClasses = {
      small: 'h-[28px] px-[var(--sp-2)]',
      medium: 'h-[32px] px-[var(--sp-3)]',
      large: 'h-[36px] px-[var(--sp-4)] text-[14px]',
      icon: 'w-[32px] h-[32px] p-0',
    };

    // Special case for secondary border since base has border-none
    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          icon && <span className="flex-shrink-0 flex items-center">{icon}</span>
        )}
        {children}
        {!loading && iconRight && <span className="flex-shrink-0 flex items-center">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
