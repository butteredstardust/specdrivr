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
  debug: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  warn: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
  error: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
};

const levelIcons: Record<LogLevel, JSX.Element> = {
  debug: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  warn: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m21.73 18-8-14a2 2 0 0 1-3.48 0l-8-14A2 2 0 0 1 4 2h16a2 2 0 0 1 1.73 3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
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

  const filteredLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .filter((log) => {
        // Filter by level
        if (!levelFilters[log.level as LogLevel]) {
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
        <span className="ios-body text-ios-secondary ios-font-text">
          {filteredLogs.length} of {logs.length} log{logs.length !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ios-font-text ${
              showFilters
                ? 'bg-ios-blue text-white'
                : 'bg-ios-secondary text-ios-text-secondary hover:bg-ios-gray-5'
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
        <div className="ios-card p-4 mb-4 border border-ios-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="ios-subheadline text-ios-text-primary font-medium">Filters</h3>
            <button
              onClick={clearFilters}
              className="ios-caption-1 text-ios-blue hover:text-blue-700 ios-font-text"
            >
              Clear All
            </button>
          </div>

          {/* Level Filters */}
          <div className="mb-3">
            <label className="ios-caption-1 text-ios-text-secondary	block mb-2">Log Level</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(levelFilters) as LogLevel[]).map((level) => (
                <label key={level} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={levelFilters[level]}
                    onChange={() => toggleLevelFilter(level)}
                    className="w-4 h-4 rounded border-ios-gray-400"
                  />
                  <span className={`ios-caption-1 ${levelColors[level].text} ios-font-text capitalize`}>
                    {level}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Task Filter */}
          {tasks.length > 0 && (
            <div className="mb-3">
              <label className="ios-caption-1 text-ios-text-secondary block mb-2">Task</label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="ios-input ios-body"
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
            <label className="ios-caption-1 text-ios-text-secondary block mb-2">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="ios-input ios-body flex-1"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="ios-input ios-body flex-1"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto ios" role="log">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 ios">
            <div className="mb-3 flex justify-center text-ios-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ios-placeholder">
                <path d="M3 3v18h18"/>
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
              </svg>
            </div>
            <p className="ios-body text-ios-placeholder ios-font-text">
              {logs.length === 0 ? 'No agent logs yet' : 'No logs match the current filters'}
            </p>
            {logs.length === 0 && (
              <p className="ios-caption text-ios-secondary ios-font-text mt-1">
                Add a log to track manual interventions
              </p>
            )}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const colors = levelColors[log.level as LogLevel] || levelColors.info;
            const icon = levelIcons[log.level as LogLevel] || levelIcons.info;

            return (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-ios bg-white hover:shadow-sm transition-shadow ios"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colors.bg} ${colors.border}`}>
                    <span className={colors.text}>{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="ios-body text-ios-primary ios-font-text break-words">
                      {log.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text} ios-font-text`}>
                        {log.level.toUpperCase()}
                      </span>
                      {log.taskId && (
                        <span className="ios-caption text-ios-secondary ios-font-text">
                          Task #{log.taskId}
                        </span>
                      )}
                      <span className="ios-caption text-ios-placeholder ios-font-text">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {(() => {
                      const ctx = log.context;
                      if (ctx && typeof ctx === 'object' && ctx !== null && Object.keys(ctx).length > 0) {
                        return (
                          <details className="mt-2">
                            <summary className="cursor-pointer ios-caption text-ios-blue ios-font-text">
                              Context
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 ios-caption text-gray-700 rounded overflow-x-auto ios-font-text">
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
    </div>
  );
}
