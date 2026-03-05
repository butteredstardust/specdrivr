'use client';

import { useState, useMemo } from 'react';
import { AgentLogSelect, TaskSelect } from '@/db/schema';
import { AddLogDialog } from './add-log-dialog';
import type { LogLevel } from '@/db/schema';
import { Button } from './ui/button';
import {
  Filter,
  Plus,
  Info,
  AlertTriangle,
  XCircle,
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Calendar,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentLogsProps {
  logs: AgentLogSelect[];
  tasks: TaskSelect[];
  onLogAdded?: () => void;
  projectId?: number;
}

const levelLozengeStyles: Record<LogLevel, string> = {
  debug: 'bg-[var(--color-bg-sunken)] text-[var(--color-text-tertiary)]',
  info: 'bg-[var(--status-inprogress-bg)] text-[var(--status-inprogress-text)]',
  warn: 'bg-[var(--status-todo-bg)] text-[var(--status-todo-text)]',
  error: 'bg-[var(--status-error-bg)] text-[var(--status-error-text)]',
};

const levelIcons: Record<LogLevel, JSX.Element> = {
  debug: <Terminal size={12} />,
  info: <Info size={12} />,
  warn: <AlertTriangle size={12} />,
  error: <XCircle size={12} />,
};

export function AgentLogs({ logs, tasks, onLogAdded }: AgentLogsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [levelFilters, setLevelFilters] = useState<Record<LogLevel, boolean>>({
    debug: true,
    info: true,
    warn: true,
    error: true,
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filteredLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .filter((log) => {
        if (log.level in levelFilters && !levelFilters[log.level as LogLevel]) return false;
        if (selectedTaskId && log.taskId !== parseInt(selectedTaskId, 10)) return false;
        const logDate = new Date(log.timestamp);
        if (dateFrom && logDate < new Date(dateFrom)) return false;
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          if (logDate > endDate) return false;
        }
        return true;
      });
  }, [logs, levelFilters, selectedTaskId, dateFrom, dateTo]);

  useMemo(() => { setCurrentPage(1); }, [filteredLogs.length]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));

  const toggleLevelFilter = (level: LogLevel) => {
    setLevelFilters((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  const clearFilters = () => {
    setLevelFilters({ debug: true, info: true, warn: true, error: true });
    setSelectedTaskId('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="flex flex-col gap-[var(--sp-4)]">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[var(--sp-4)]">
          <span className="text-[12px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Agent Activity ({filteredLogs.length})
          </span>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter size={14} />}
            className={cn(showFilters && "bg-[var(--color-bg-selected)] text-[var(--color-brand-bold)] border-[var(--color-border-selected)]")}
          >
            Filters
          </Button>
        </div>
        <Button
          variant="primary"
          size="small"
          onClick={() => setShowAddDialog(true)}
          icon={<Plus size={16} />}
        >
          Add Log
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] p-[var(--sp-5)] space-y-[var(--sp-4)] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-[12px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Active Filters</h4>
            <Button variant="ghost" size="small" onClick={clearFilters} icon={<X size={14} />} className="text-[var(--color-text-danger)] hover:text-[var(--color-text-danger)]">
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--sp-6)]">
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-[var(--sp-2)]">Log Levels</label>
              <div className="flex flex-wrap gap-[var(--sp-2)]">
                {(Object.keys(levelFilters) as LogLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => toggleLevelFilter(level)}
                    className={cn(
                      "px-2 py-1 rounded-[var(--radius-sm)] text-[11px] font-bold uppercase transition-all border",
                      levelFilters[level]
                        ? cn("border-[var(--color-border-selected)]", levelLozengeStyles[level])
                        : "bg-[var(--color-bg-surface)] border-[var(--color-border-default)] text-[var(--color-text-tertiary)] opacity-50"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-[var(--sp-2)]">Related Task</label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full h-[32px] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[13px] px-[var(--sp-2)] focus:border-[var(--color-border-selected)] outline-none"
              >
                <option value="">All Tasks</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>SD-{task.id}: {task.description?.substring(0, 30)}...</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-[var(--sp-2)]">Date Range</label>
              <div className="flex items-center gap-[var(--sp-2)]">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-[32px] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[12px] px-[var(--sp-2)]"
                />
                <span className="text-[var(--color-text-tertiary)]">-</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-[32px] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[12px] px-[var(--sp-2)]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="space-y-[var(--sp-2)]">
        {filteredLogs.length === 0 ? (
          <div className="py-[var(--sp-12)] flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border-default)] rounded-[var(--radius-lg)] opacity-60">
            <Search size={32} className="text-[var(--color-border-default)] mb-[var(--sp-3)]" />
            <p className="text-[14px] text-[var(--color-text-secondary)] italic">No logs found matching your filters.</p>
          </div>
        ) : (
          paginatedLogs.map((log) => {
            const level = log.level as LogLevel;
            return (
              <div
                key={log.id}
                className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] p-[var(--sp-3)] hover:border-[var(--color-border-selected)] transition-colors group"
              >
                <div className="flex items-start gap-[var(--sp-4)]">
                  <div className={cn("p-2 rounded-full", levelLozengeStyles[level])}>
                    {levelIcons[level]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-[var(--sp-3)] mb-1">
                      <span className={cn("px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold uppercase", levelLozengeStyles[level])}>
                        {log.level}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-text-tertiary)] group-hover:text-[var(--color-brand-bold)] transition-colors">
                        <Clock size={10} />
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • SD-{log.taskId || 'SYSTEM'}
                      </div>
                    </div>
                    <p className="text-[14px] text-[var(--color-text-primary)] leading-relaxed">{log.message}</p>

                    {!!log.context && typeof log.context === 'object' && Object.keys(log.context).length > 0 && (
                      <details className="mt-[var(--sp-2)] group/details">
                        <summary className="text-[12px] font-bold text-[var(--color-brand-bold)] cursor-pointer hover:underline list-none flex items-center gap-1">
                          <Terminal size={12} />
                          View Execution Context
                        </summary>
                        <pre className="mt-[var(--sp-2)] p-[var(--sp-3)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[11px] font-mono overflow-x-auto linear-scrollbar">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-[var(--sp-4)] border-t border-[var(--color-border-default)]">
          <span className="text-[12px] text-[var(--color-text-tertiary)] font-medium">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-[var(--sp-2)]">
            <Button variant="secondary" size="small" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} icon={<ChevronLeft size={14} />}>
              Previous
            </Button>
            <Button variant="secondary" size="small" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} iconRight={<ChevronRight size={14} />}>
              Next
            </Button>
          </div>
        </div>
      )}

      {showAddDialog && (
        <AddLogDialog
          tasks={tasks}
          isOpen={true}
          onClose={() => setShowAddDialog(false)}
          onLogAdded={() => { setShowAddDialog(false); onLogAdded?.(); }}
        />
      )}
    </div>
  );
}
