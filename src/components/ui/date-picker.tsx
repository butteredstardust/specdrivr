'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  /** `date-fns` pattern for the trigger label. Narrow triggers pass a short one. */
  dateFormat?: string;
  /** Accessible name for the trigger, needed when two pickers form a range. */
  triggerLabel?: string;
}

export function DatePicker({
  date,
  setDate,
  className,
  placeholder = 'Pick a date',
  dateFormat = 'PPP',
  triggerLabel,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          aria-label={triggerLabel}
          className={cn(
            'w-[240px] justify-start text-left font-normal',
            !date && 'text-fg-muted',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, dateFormat) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </PopoverContent>
    </Popover>
  );
}
