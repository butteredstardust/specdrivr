"use client";

import { TaskSelect } from '@/db/schema';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { LogTestResultDialog } from './log-test-result-dialog';
import { taskStatusColors } from '@/lib/ios-styles';
import {
  ChevronsUp,
  ChevronUp,
  Minus,
  ChevronDown,
  ChevronsDown,
  CheckCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskSelect;
  onClick?: (task: TaskSelect) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const priority = Math.max(1, Math.min(5, (task.priority as number) || 1));
  const status = (task.status as string) || 'todo';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityIcon = (p: number) => {
    switch (p) {
      case 5: return <ChevronsUp size={14} className="text-[var(--color-text-danger)]" />;
      case 4: return <ChevronUp size={14} className="text-[var(--color-text-danger)]" />;
      case 3: return <Minus size={14} className="text-[var(--status-inprogress-text)]" />;
      case 2: return <ChevronDown size={14} className="text-[var(--color-brand-bold)]" />;
      case 1: return <ChevronsDown size={14} className="text-[var(--color-brand-bold)]" />;
      default: return <Minus size={14} />;
    }
  };

  const statusInfo = taskStatusColors[status as keyof typeof taskStatusColors] || taskStatusColors.todo;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] shadow-[var(--shadow-card)] p-[var(--sp-3)] cursor-pointer hover:bg-[var(--color-bg-hovered)] transition-all group",
          isDragging && "z-50 shadow-2xl scale-[1.02]"
        )}
        onClick={() => onClick?.(task)}
      >
        <p className="text-[14px] text-[var(--color-text-primary)] leading-tight mb-[var(--sp-3)] line-clamp-2 group-hover:text-[var(--color-brand-bold)] transition-colors">
          {task.description || 'Untitled Task'}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-[var(--sp-2)]">
            {getPriorityIcon(priority)}
            <span className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase leading-none">
              SD-{task.id}
            </span>
          </div>

          <div className="flex items-center gap-[var(--sp-2)]">
            <span className={cn(
              "px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold uppercase tracking-tight",
              statusInfo.bg, statusInfo.text
            )}>
              {status.replace('_', ' ')}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowLogDialog(true); }}
              className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-bold)] hover:bg-[var(--color-bg-sunken)] rounded transition-all"
              title="Log Test Result"
            >
              <CheckCircle size={14} />
            </button>
          </div>
        </div>
      </div>

      {showLogDialog && (
        <LogTestResultDialog
          task={task}
          isOpen={true}
          onClose={() => setShowLogDialog(false)}
          onResultLogged={() => setShowLogDialog(false)}
        />
      )}
    </>
  );
}
