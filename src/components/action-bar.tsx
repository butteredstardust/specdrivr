"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Plus, Filter, X } from 'lucide-react';
import { CreateTaskDialog } from './create-task-dialog';
import { PlanSelect, TaskSelect } from '@/db/schema';

interface ActionBarProps {
  projectId: number;
  plans?: PlanSelect[];
  existingTasks?: TaskSelect[];
  onFilterChange?: (filters: any) => void;
}

export function ActionBar({ projectId, plans = [], existingTasks = [], onFilterChange }: ActionBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex items-center justify-between mb-[var(--sp-6)]">
      <div className="flex items-center gap-[var(--sp-4)]">
        <CreateTaskDialog projectId={projectId} plans={plans} existingTasks={existingTasks} onTaskCreated={() => {}} />

        <div className="relative">
          <Button
            variant="ghost"
            size="small"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-[var(--sp-2)]"
            data-testid="priority-filter"
          >
            <Filter size={16} />
            Filter
          </Button>

          {showFilters && (
            <div className="absolute top-full mt-[var(--sp-2)] left-0 w-48 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-dropdown)] p-[var(--sp-2)] z-10 flex flex-col gap-1">
              <button data-testid="filter-high" className="text-left px-2 py-1 text-sm hover:bg-[var(--bg-hovered)] rounded" onClick={() => onFilterChange?.({ priority: 'high' })}>High Priority</button>
              <button data-testid="filter-medium" className="text-left px-2 py-1 text-sm hover:bg-[var(--bg-hovered)] rounded" onClick={() => onFilterChange?.({ priority: 'medium' })}>Medium Priority</button>
              <button data-testid="filter-low" className="text-left px-2 py-1 text-sm hover:bg-[var(--bg-hovered)] rounded" onClick={() => onFilterChange?.({ priority: 'low' })}>Low Priority</button>
              <div className="h-px bg-[var(--border-default)] my-1" />
              <button data-testid="clear-filters" className="text-left px-2 py-1 text-sm hover:bg-[var(--bg-hovered)] rounded text-red-500 flex items-center gap-1" onClick={() => onFilterChange?.({})}>
                <X size={14} /> Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
