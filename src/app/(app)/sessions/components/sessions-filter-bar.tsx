'use client';

import * as React from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Search, X, Calendar as CalendarIcon, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { format, parse } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'all', label: 'ALL' },
  { value: 'running', label: 'RUNNING' },
  { value: 'completed', label: 'DONE' },
  { value: 'paused', label: 'PAUSED' },
  { value: 'failed', label: 'FAILED' },
  { value: 'cancelled', label: 'CANCELLED' },
] as const;

interface SessionsFilterBarProps {
  specs: Array<{ id: number; name: string }>;
}

export function SessionsFilterBar({ specs }: SessionsFilterBarProps) {
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({
      shallow: true,
      history: 'replace',
      throttleMs: 300,
    })
  );
  const [status, setStatus] = useQueryState(
    'status',
    parseAsString.withDefault('all').withOptions({ shallow: true, history: 'replace' })
  );
  const [specId, setSpecId] = useQueryState(
    'specId',
    parseAsString.withDefault('all').withOptions({ shallow: true, history: 'replace' })
  );
  const [from, setFrom] = useQueryState(
    'from',
    parseAsString.withDefault('').withOptions({ shallow: true, history: 'replace' })
  );
  const [to, setTo] = useQueryState(
    'to',
    parseAsString.withDefault('').withOptions({ shallow: true, history: 'replace' })
  );

  const isAnyFilterActive =
    search !== '' || status !== 'all' || specId !== 'all' || from !== '' || to !== '';

  const clearFilters = () => {
    setSearch(null);
    setStatus(null);
    setSpecId(null);
    setFrom(null);
    setTo(null);
  };

  const parseDateString = (dateStr: string) => {
    if (!dateStr) return undefined;
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const formatDateString = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <div className="border-line flex flex-wrap items-center gap-4 border-b px-6 py-3">
      {/* Search */}
      <div className="relative w-64">
        <Search className="text-fg-muted absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
        <Input
          placeholder="Search sessions…"
          className="bg-surface-inset text-2xs h-8 pl-8 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value || null)}
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearch(null)}
            aria-label="Clear search"
            className="text-fg-muted hover:text-fg absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="bg-line/50 mx-1 h-4 w-px" />

      {/* Status Filter */}
      <div className="flex items-center gap-1.5">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = status === opt.value;
          return (
            <Button
              key={opt.value}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatus(opt.value === 'all' ? null : opt.value)}
              className={cn(
                'text-2xs h-7 px-3 font-mono transition-all',
                isActive
                  ? 'bg-surface-inset text-white'
                  : 'text-fg-muted hover:bg-surface-inset hover:text-fg'
              )}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Spec Select */}
        <div className="flex items-center gap-2">
          <Hash className="text-fg-muted h-3 w-3" />
          <Select value={specId} onValueChange={(val) => setSpecId(val === 'all' ? null : val)}>
            <SelectTrigger className="bg-surface-inset text-2xs h-8 w-44">
              <SelectValue placeholder="All specs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-2xs">
                ALL SPECS
              </SelectItem>
              {specs.map((spec) => (
                <SelectItem key={spec.id} value={String(spec.id)} className="text-2xs">
                  {spec.name.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-fg-muted h-3 w-3" />
          <div className="flex items-center">
            <DatePicker
              date={parseDateString(from)}
              setDate={(d) => setFrom(formatDateString(d) || null)}
              placeholder="From"
              className="text-2xs h-8 w-28 rounded-r-none border-r-0"
            />
            <DatePicker
              date={parseDateString(to)}
              setDate={(d) => setTo(formatDateString(d) || null)}
              placeholder="To"
              className="text-2xs h-8 w-28 rounded-l-none"
            />
          </div>
        </div>

        {isAnyFilterActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-fg-muted hover:text-danger text-2xs h-8 gap-1.5 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            CLEAR
          </Button>
        )}
      </div>
    </div>
  );
}
