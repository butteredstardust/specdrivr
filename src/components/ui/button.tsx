'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      loading = false,
      icon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center gap-[6px] font-medium rounded-[6px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none border cursor-pointer';

    const variantClasses = {
      primary: 'bg-accent text-white border-transparent hover:bg-accent-hover',
      secondary: 'bg-transparent text-text-secondary border-border-default hover:bg-bg-hover hover:text-text-primary hover:border-border-strong',
      danger: 'bg-status-error text-white border-transparent hover:opacity-90',
      ghost: 'bg-transparent text-text-secondary border-transparent hover:bg-bg-hover hover:text-text-primary',
    };

    const sizeClasses = {
      small: 'h-[24px] px-[8px] text-[11px]',
      medium: 'h-[28px] px-[10px] text-[12px]',
      large: 'h-[32px] px-[12px] text-[13px]',
      icon: 'w-[28px] h-[28px] p-0',
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();

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
      </button>
    );
  }
);

Button.displayName = 'Button';
