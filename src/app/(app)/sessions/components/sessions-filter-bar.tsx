'use client';

import * as React from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Search } from 'lucide-react';
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

const STATUS_OPTIONS = ['all', 'running', 'completed', 'paused', 'failed', 'cancelled'] as const;

interface SessionsFilterBarProps {
  specs: Array<{ id: number; name: string }>;
}

export function SessionsFilterBar({ specs }: SessionsFilterBarProps) {
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault('all'));
  const [specId, setSpecId] = useQueryState('specId', parseAsString.withDefault('all'));
  const [from, setFrom] = useQueryState('from', parseAsString.withDefault(''));
  const [to, setTo] = useQueryState('to', parseAsString.withDefault(''));

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
    <div className="border-border-default flex flex-wrap items-center gap-3 border-b px-6 py-2.5">
      <div className="relative w-52">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
        <Input
          placeholder="Search sessions..."
          className="h-8 pl-8 font-mono text-[10px] tracking-wider uppercase"
          value={search}
          onChange={(e) => setSearch(e.target.value || null)}
        />
      </div>

      <div className="flex items-center gap-1">
        {STATUS_OPTIONS.map((s) => {
          const isActive = status === s;
          return (
            <Button
              key={s}
              variant={isActive ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setStatus(s === 'all' ? null : s)}
              className={cn(
                'h-7 px-2.5 font-mono text-[10px] tracking-wider uppercase transition-all',
                !isActive && 'bg-secondary/50 text-muted-foreground hover:text-foreground'
              )}
            >
              {s}
            </Button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Select value={specId} onValueChange={(val) => setSpecId(val === 'all' ? null : val)}>
          <SelectTrigger className="h-8 w-40 font-mono text-[10px] tracking-wider uppercase">
            <SelectValue placeholder="All specs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All specs</SelectItem>
            {specs.map((spec) => (
              <SelectItem key={spec.id} value={String(spec.id)}>
                {spec.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker
          date={parseDateString(from)}
          setDate={(d) => setFrom(formatDateString(d) || null)}
          placeholder="From date"
          className="h-8 w-36 font-mono text-[10px]"
        />
        <DatePicker
          date={parseDateString(to)}
          setDate={(d) => setTo(formatDateString(d) || null)}
          placeholder="To date"
          className="h-8 w-36 font-mono text-[10px]"
        />
        {isAnyFilterActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground h-8 font-mono text-[10px] tracking-wider uppercase"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
