import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  category: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ category, title, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn('border-line flex items-center justify-between border-b px-6 py-4', className)}
    >
      <div>
        {/* An eyebrow, not a terminal banner: sentence case, sans, no
            letter-spacing. The uppercase mono treatment went with the retro
            layer (DESIGN_SYSTEM.md §4). */}
        <div className="text-fg-muted text-2xs mb-1 font-medium">{category}</div>
        <h1 className="text-fg text-2xl leading-tight font-semibold tracking-[-0.015em]">
          {title}
        </h1>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
