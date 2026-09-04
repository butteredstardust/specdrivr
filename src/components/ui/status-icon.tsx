import * as React from 'react';
import { AlertTriangle, Check, Circle, CircleX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StatusIcon — the canonical status glyph.
 *
 * Replaces the DAEMON mascot that previously carried agent state. Implements
 * the status vocabulary in DESIGN_SYSTEM.md §8.4, so every surface that shows
 * agent, task, spec, or session state uses one glyph set.
 *
 * Colour alone is never sufficient (§10). Callers must render a label alongside
 * this, or pass an explicit `label` so the glyph is announced.
 */
export type Status = 'idle' | 'working' | 'success' | 'blocked' | 'error';

const CONFIG: Record<Status, { Icon: typeof Circle; className: string; label: string }> = {
  idle: { Icon: Circle, className: 'text-fg-muted', label: 'Idle' },
  working: { Icon: Loader2, className: 'text-info animate-spin', label: 'Running' },
  success: { Icon: Check, className: 'text-success', label: 'Complete' },
  blocked: { Icon: AlertTriangle, className: 'text-warning', label: 'Blocked' },
  error: { Icon: CircleX, className: 'text-danger', label: 'Failed' },
};

export interface StatusIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
  status: Status;
  /** Pixel size. Defaults to 16 — the standard inline icon size. */
  size?: number;
  /**
   * Accessible label. Pass `null` when an adjacent visible label already names
   * the status, so screen readers don't hear it twice.
   */
  label?: string | null;
}

export function StatusIcon({ status, size = 16, label, className, ...props }: StatusIconProps) {
  const { Icon, className: statusClassName, label: defaultLabel } = CONFIG[status];
  const accessibleLabel = label === undefined ? defaultLabel : label;

  return (
    <Icon
      data-slot="status-icon"
      data-status={status}
      size={size}
      strokeWidth={2}
      className={cn('shrink-0', statusClassName, className)}
      aria-hidden={accessibleLabel === null ? true : undefined}
      aria-label={accessibleLabel ?? undefined}
      role={accessibleLabel ? 'img' : undefined}
      {...props}
    />
  );
}
