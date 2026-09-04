'use client';

import * as React from 'react';
import { format, parse } from 'date-fns';
import { Search, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const filterToolbarVariants = cva('flex flex-wrap items-center gap-x-3 gap-y-2', {
  variants: {
    variant: {
      /** Full-bleed strip directly under `PageHeader`, carrying the page gutter. */
      page: 'border-line border-b px-6 py-3',
      /** Inside a panel that already owns its padding, e.g. the audit log. */
      inline: '',
    },
  },
  defaultVariants: { variant: 'page' },
});

interface FilterToolbarProps extends VariantProps<typeof filterToolbarVariants> {
  children: React.ReactNode;
  className?: string;
}

/**
 * FilterToolbar
 *
 * The single search/filter strip used on the index pages and the audit log.
 * Projects, Specs, Sessions and the audit log each grew their own version and
 * all four drifted: uppercase mono pills on one, sentence-case sans on another,
 * mono placeholders and native date inputs on a third, a clear-all on one only,
 * and three different active-pill treatments (one of which was `text-white`, a
 * raw colour rather than a token). The parts here are the whole vocabulary — a
 * page composes them, it does not restyle them.
 *
 * Control geometry is fixed for every part: `h-8`, `text-xs`, `rounded-md`
 * (DESIGN_SYSTEM.md §3.1, §5). Labels are sentence-case sans; mono is reserved
 * for IDs, code, logs and timestamps (§3.3).
 */
export function FilterToolbar({ children, className, variant }: FilterToolbarProps) {
  return (
    <div data-slot="filter-toolbar" className={filterToolbarVariants({ variant, className })}>
      {children}
    </div>
  );
}

/**
 * Right-aligned group. `ml-auto` on the group rather than on a single control,
 * so a wrapped row keeps its trailing controls together.
 */
export function FilterToolbarActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 md:ml-auto', className)}>
      {children}
    </div>
  );
}

/** Muted result count, e.g. `12 projects`. */
export function FilterToolbarMeta({ children }: { children: React.ReactNode }) {
  return <span className="text-fg-muted text-xs">{children}</span>;
}

interface FilterSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  /** Accessible name; also names the clear button. */
  label: string;
  className?: string;
}

export function FilterSearch({
  value,
  onValueChange,
  placeholder,
  label,
  className,
}: FilterSearchProps) {
  return (
    <div className={cn('relative w-full sm:w-64', className)}>
      <Search
        aria-hidden
        className="text-fg-muted pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2"
      />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="h-8 pr-8 pl-8 text-xs [&::-webkit-search-cancel-button]:hidden"
      />
      {value !== '' && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onValueChange('')}
          aria-label={`Clear ${label.toLowerCase()}`}
          className="text-fg-muted hover:text-fg absolute top-1/2 right-1 size-6 -translate-y-1/2"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

interface FilterTextInputProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Fired when the field loses focus, for filters that commit on blur. */
  onCommit?: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}

/** A plain single-line filter field, for anything that is not the main search. */
export function FilterTextInput({
  value,
  onValueChange,
  onCommit,
  placeholder,
  label,
  className,
}: FilterTextInputProps) {
  return (
    <Input
      aria-label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onBlur={onCommit ? (e) => onCommit(e.target.value) : undefined}
      className={cn('h-8 w-48 text-xs', className)}
    />
  );
}

const filterTabVariants = cva(
  [
    'inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5',
    'text-xs font-medium whitespace-nowrap transition-colors duration-[120ms]',
  ],
  {
    variants: {
      active: {
        // A raised surface plus a hairline inside a sunken track, so the
        // selection reads in both themes without borrowing the accent — which
        // the design system reserves for calls to action, not for state. The
        // inactive border is transparent so nothing shifts on selection.
        true: 'border-line-subtle bg-surface-raised text-fg',
        false: 'text-fg-muted hover:text-fg border-transparent',
      },
    },
    defaultVariants: { active: false },
  }
);

export interface FilterTabOption<T extends string = string> {
  value: T;
  label: string;
  /** Rendered as a trailing count when greater than zero. */
  count?: number;
}

interface FilterTabsProps<T extends string> extends Omit<
  VariantProps<typeof filterTabVariants>,
  'active'
> {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly FilterTabOption<T>[];
  /** Accessible name for the group, e.g. `Filter by status`. */
  label: string;
  className?: string;
}

/**
 * Segmented status filter. Buttons with `aria-pressed` rather than
 * tab/tabpanel semantics: these filter a list in place, they do not switch
 * between panels, and announcing them as tabs would promise a relationship
 * that does not exist.
 *
 * Generic over the option values so a page can back it with a nuqs literal
 * parser and have the compiler reject a tab the parser would not accept.
 */
export function FilterTabs<T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: FilterTabsProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        // `p-px` on a bordered track around `h-7` pills lands the group on
        // exactly the 32px every other control in the toolbar is.
        'bg-surface-sunken border-line-subtle flex flex-wrap items-center gap-0.5 rounded-md border p-px',
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onValueChange(option.value)}
            className={filterTabVariants({ active: isActive })}
          >
            {option.label}
            {option.count != null && option.count > 0 && (
              <span className={cn('text-2xs tabular-nums', isActive ? 'opacity-60' : 'opacity-70')}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly FilterSelectOption[];
  label: string;
  icon?: LucideIcon;
  className?: string;
}

export function FilterSelect({
  value,
  onValueChange,
  options,
  label,
  icon: Icon,
  className,
}: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon aria-hidden className="text-fg-muted h-3.5 w-3.5 shrink-0" />}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label={label} className={cn('h-8 w-44 text-xs', className)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const DATE_VALUE_FORMAT = 'yyyy-MM-dd';

/** Parses the `yyyy-MM-dd` value the URL carries; anything else is treated as unset. */
function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, DATE_VALUE_FORMAT, new Date());
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatDateValue(date: Date | undefined): string {
  return date ? format(date, DATE_VALUE_FORMAT) : '';
}

interface FilterDateRangeProps {
  /** `yyyy-MM-dd`, or `''` when unset. */
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  label: string;
  className?: string;
}

export function FilterDateRange({
  from,
  to,
  onFromChange,
  onToChange,
  label,
  className,
}: FilterDateRangeProps) {
  return (
    <div role="group" aria-label={label} className={cn('flex items-center', className)}>
      <DatePicker
        date={parseDateValue(from)}
        setDate={(date) => onFromChange(formatDateValue(date))}
        placeholder="From"
        // `MMM d` rather than the picker's default long date: two of these sit
        // side by side in a filter bar, where "September 4th, 2026" truncates.
        dateFormat="MMM d"
        triggerLabel={`${label}: start`}
        className="h-8 w-28 rounded-r-none border-r-0 text-xs"
      />
      <DatePicker
        date={parseDateValue(to)}
        setDate={(date) => onToChange(formatDateValue(date))}
        placeholder="To"
        dateFormat="MMM d"
        triggerLabel={`${label}: end`}
        className="h-8 w-28 rounded-l-none text-xs"
      />
    </div>
  );
}

interface FilterClearButtonProps {
  onClear: () => void;
}

export function FilterClearButton({ onClear }: FilterClearButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClear}
      className="text-fg-muted hover:text-fg h-8 gap-1.5 text-xs"
    >
      <X className="h-3.5 w-3.5" />
      Clear filters
    </Button>
  );
}
