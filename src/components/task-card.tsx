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
  FileText,
  RotateCcw,
  Check
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
    let iconClass = "";
    switch (p) {
      case 5: iconClass = "text-[var(--status-blocked-text)] border-red-500"; break;
      case 4: iconClass = "text-[var(--status-blocked-text)] border-orange-500"; break;
      case 3: iconClass = "text-[var(--status-inprogress-text)] border-yellow-500"; break;
      case 2: iconClass = "text-[var(--brand-primary)] border-blue-500"; break;
      case 1: iconClass = "text-[var(--brand-primary)] border-green-500"; break;
      default: iconClass = "border-gray-500";
    }

    const innerIcon = () => {
        switch (p) {
            case 5: return <ChevronsUp size={14} />;
            case 4: return <ChevronUp size={14} />;
            case 3: return <Minus size={14} />;
            case 2: return <ChevronDown size={14} />;
            case 1: return <ChevronsDown size={14} />;
            default: return <Minus size={14} />;
        }
    };
    return <span data-testid="priority-indicator" className={cn("border-2 rounded", iconClass)}>{innerIcon()}</span>;
  };

  const statusInfo = taskStatusColors[status as keyof typeof taskStatusColors] || taskStatusColors.todo;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        data-testid="task-card"
        data-task-id={task.id}
        className={cn(
          "bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[10px] px-[12px] mb-[6px] shadow-[var(--shadow-card)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] hover:border-l-[2px] hover:border-l-[var(--brand-primary)] hover:pl-[10px] cursor-pointer transition-all group",
          isDragging && "z-50 shadow-2xl scale-[1.02]"
        )}
        onClick={() => onClick?.(task)}
      >
        <p className="text-[13px] font-[500] text-[var(--text-primary)] leading-tight mb-[var(--sp-3)] line-clamp-3 transition-colors" data-testid="task-description">
          {task.description || 'Untitled Task'}
        </p>

        {Array.isArray(task.filesInvolved) && task.filesInvolved.length > 0 && (
            <div data-testid="task-files" className="hidden">
                {(task.filesInvolved as string[]).join(',')}
            </div>
        )}

        <div data-testid="retry-count" className="hidden">
            {(task as any).retries || 0}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-[var(--sp-2)]">
            {getPriorityIcon(priority)}
            <span className="text-[11px] font-[400] text-[var(--text-tertiary)] font-mono leading-none">
              SD-{task.id}
            </span>
          </div>

          <div className="flex items-center gap-[var(--sp-2)]">
            <span className={cn(
              "px-[6px] flex items-center h-[20px] rounded-[3px] border-none text-[11px] font-bold uppercase tracking-[0.04em] whitespace-nowrap",
              statusInfo.bg, statusInfo.text
            )}>
              {status.replace('_', ' ')}
            </span>
            <div className="hidden group-hover:flex items-center">
                <button
                data-testid="retry-task"
                onClick={(e) => { e.stopPropagation(); /* TODO */ }}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] hover:bg-[var(--bg-sunken)] rounded transition-all"
                title="Retry Task"
                >
                <RotateCcw size={14} />
                </button>
                <button
                data-testid="mark-done"
                onClick={(e) => { e.stopPropagation(); /* TODO */ }}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] hover:bg-[var(--bg-sunken)] rounded transition-all"
                title="Mark Done"
                >
                <Check size={14} />
                </button>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowLogDialog(true); }}
              className="p-1 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] hover:bg-[var(--bg-sunken)] rounded transition-all"
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
