import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    intensity?: 'low' | 'medium' | 'high'; // Keep props for compatibility but style identically
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, intensity = 'medium', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden',
                    className
                )}
                {...props}
            >
                <div>{children}</div>
            </div>
        );
    }
);

GlassCard.displayName = 'GlassCard';
