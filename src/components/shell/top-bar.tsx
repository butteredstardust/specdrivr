'use client';

import React from 'react';
import { PixelBreadcrumb } from '@pxlkit/ui-kit';
import { NotificationBell } from './notification-bell';
import { UserMenu } from './user-menu';

type TopBarProps = {
  title: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
};

export function TopBar({ title, breadcrumb, actions }: TopBarProps) {
  return (
    <header className="h-14 bg-[--bg-surface] border-b border-[--border-default] flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-bold text-[--text-primary] leading-tight">
          {title}
        </h1>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="text-xs text-[--text-muted]">
            <PixelBreadcrumb items={breadcrumb} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {actions && <div className="mr-4">{actions}</div>}
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
