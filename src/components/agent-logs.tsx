'use client';

import { useState, useMemo } from 'react';
import { AgentLogSelect, TaskSelect } from '@/db/schema';
import { AddLogDialog } from './add-log-dialog';
import type { LogLevel } from '@/db/schema';

interface AgentLogsProps {
  logs: AgentLogSelect[];
  tasks: TaskSelect[];
  onLogAdded?: () => void;
  projectId?: number;
}

const levelColors: Record<LogLevel, { bg: string; text: string; border: string }> = {
  debug: { bg: 'bg-status-idle-6', text: 'text-status-idle-1', border: 'border-status-idle-4' },
  info: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20' },
  warn: { bg: 'bg-ios-yellow/10', text: 'text-ios-yellow', border: 'border-ios-yellow/20' },
  error: { bg: 'bg-status-error/10', text: 'text-status-error', border: 'border-status-error/20' },
};

const levelIcons: Record<LogLevel, JSX.Element> = {
  debug: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warn: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m21.73 18-8-14a2 2 0 0 1-3.48 0l-8-14A2 2 0 0 1 4 2h16a2 2 0 0 1 1.73 3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
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
      .sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .filter((log) => {
        // Filter by level - allow unknown levels by default
        const levelInFilters = log.level in levelFilters;
        if (levelInFilters && !levelFilters[log.level as LogLevel]) {
          return false;
        }

        // Filter by task
        if (selectedTaskId && log.taskId !== parseInt(selectedTaskId, 10)) {
          return false;
        }

        // Filter by date range
        const logDate = new Date(log.timestamp);
        if (dateFrom && logDate < new Date(dateFrom)) {
          return false;
        }
        if (dateTo) {
          // Set the time to end of day for inclusive filtering
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          if (logDate > endDate) {
            return false;
          }
        }

        return true;
      });
  }, [logs, levelFilters, selectedTaskId, dateFrom, dateTo]);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filteredLogs.length]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));

  const toggleLevelFilter = (level: LogLevel) => {
    setLevelFilters((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  const clearFilters = () => {
    setLevelFilters({ debug: true, info: true, warn: true, error: true });
    setSelectedTaskId('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div>
      {/* Header with Add and Filter buttons */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] text-text-secondary ">
          {filteredLogs.length} of {logs.length} log{logs.length !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1 rounded-ios-md text-[11px] font-medium font-medium transition-colors  ${showFilters
              ? 'bg-accent text-white'
              : 'bg-ios-secondary text-text-secondary hover:bg-status-idle-5'
              }`}
          >
            Filters
          </button>
          <AddLogDialog
            tasks={tasks}
            isOpen={showAddDialog}
            onClose={() => setShowAddDialog(false)}
            onLogAdded={() => {
              setShowAddDialog(false);
              onLogAdded?.();
            }}
          />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-bg-elevated border border-border-default rounded-[8px] p-4 mb-4 border border-border-default">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] text-text-primary font-medium">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-[11px] text-accent hover:text-accent/80 "
            >
              Clear All
            </button>
          </div>

          {/* Level Filters */}
          <div className="mb-3">
            <label className="text-[11px] text-text-secondary block mb-2">Log Level</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(levelFilters) as LogLevel[]).map((level) => (
                <label key={level} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={levelFilters[level]}
                    onChange={() => toggleLevelFilter(level)}
                    className="w-4 h-4 rounded border-border-default"
                  />
                  <span className={`text-[11px] ${levelColors[level].text}  capitalize`}>
                    {level}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Task Filter */}
          {tasks.length > 0 && (
            <div className="mb-3">
              <label className="text-[11px] text-text-secondary block mb-2">Task</label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="h-[30px] bg-bg-elevated border border-border-default rounded-[6px] text-text-primary text-[12px] px-[10px] outline-none focus:border-border-strong placeholder:text-text-tertiary transition-colors text-[13px]"
              >
                <option value="">All Tasks</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    #{task.id}: {(task.description || '').substring(0, 40)}
                    {task.description && task.description.length > 40 ? '...' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Filter */}
          <div>
            <label className="text-[11px] text-text-secondary block mb-2">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-[30px] bg-bg-elevated border border-border-default rounded-[6px] text-text-primary text-[12px] px-[10px] outline-none focus:border-border-strong placeholder:text-text-tertiary transition-colors text-[13px] flex-1"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-[30px] bg-bg-elevated border border-border-default rounded-[6px] text-text-primary text-[12px] px-[10px] outline-none focus:border-border-strong placeholder:text-text-tertiary transition-colors text-[13px] flex-1"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto ios" role="log">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 ios">
            <div className="mb-3 flex justify-center text-text-tertiary">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
            </div>
            <p className="text-[13px] text-text-tertiary ">
              {logs.length === 0 ? 'No agent logs yet' : 'No logs match the current filters'}
            </p>
            {logs.length === 0 && (
              <p className="ios-caption text-text-secondary  mt-1">
                Add a log to track manual interventions
              </p>
            )}
          </div>
        ) : (
          paginatedLogs.map((log) => {
            const colors = levelColors[log.level as LogLevel] || levelColors.info;
            const icon = levelIcons[log.level as LogLevel] || levelIcons.info;

            return (
              <div
                key={log.id}
                className="p-3 rounded-ios-md border border-ios bg-bg-elevated hover:shadow-ios-elevated transition-shadow ios"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colors.bg} ${colors.border}`}>
                    <span className={colors.text}>{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-ios-primary  break-words">
                      {log.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-ios-md text-[11px] font-medium font-medium ${colors.bg} ${colors.text} `}>
                        {log.level.toUpperCase()}
                      </span>
                      {log.taskId && (
                        <span className="ios-caption text-text-secondary ">
                          Task #{log.taskId}
                        </span>
                      )}
                      <span className="ios-caption text-text-tertiary ">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {(() => {
                      const ctx = log.context;
                      if (ctx && typeof ctx === 'object' && ctx !== null && Object.keys(ctx).length > 0) {
                        return (
                          <details className="mt-2">
                            <summary className="cursor-pointer ios-caption text-accent ">
                              Context
                            </summary>
                            <pre className="mt-2 p-2 bg-status-idle-6 text-[11px] text-text-primary rounded-ios-md overflow-x-auto ">
                              {JSON.stringify(ctx, null, 2)}
                            </pre>
                          </details>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 py-2 border-t border-border-default">
          <span className="ios-caption text-text-secondary">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-ios-md ios-caption font-medium border border-border-default disabled:opacity-50 disabled:cursor-not-allowed hover:bg-status-idle-5"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-ios-md ios-caption font-medium border border-border-default disabled:opacity-50 disabled:cursor-not-allowed hover:bg-status-idle-5"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
