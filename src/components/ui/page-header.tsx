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
      className={cn(
        'border-border-default flex items-center justify-between border-b px-6 py-4',
        className
      )}
    >
      <div>
        <div className="text-muted-foreground mb-1 font-mono text-[11px] font-medium tracking-[0.12em] uppercase">
          {category}
        </div>
        <h1 className="text-foreground text-2xl leading-tight font-semibold tracking-[-0.015em]">
          {title}
        </h1>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
