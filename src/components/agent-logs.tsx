'use client';

import { useState } from 'react';
import { AgentLogSelect, TaskSelect } from '@/db/schema';
import { AddLogDialog } from './add-log-dialog';
import type { LogLevel } from '@/db/schema';

interface AgentLogsProps {
  logs: AgentLogSelect[];
  tasks: TaskSelect[];
  onLogAdded?: () => void;
  projectId?: number;
}

const levelColors: Record<LogLevel, { bg: string; text: string }> = {
  debug: { bg: 'bg-gray-100', text: 'text-gray-700' },
  info: { bg: 'bg-blue-100', text: 'text-blue-700' },
  warn: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  error: { bg: 'bg-red-100', text: 'text-red-700' },
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

export function AgentLogs({ logs, tasks, onLogAdded, projectId }: AgentLogsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const sortedLogs = [...logs].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div>
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-2">
        <span className="ios-body text-ios-secondary ios-font-text">
          {sortedLogs.length} log{sortedLogs.length !== 1 ? 's' : ''}
        </span>
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

      <div className="space-y-2 max-h-80 overflow-y-auto ios">
        {sortedLogs.length === 0 ? (
          <div className="text-center py-8 ios">
            <div className="mb-3 flex justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ios-placeholder">
                <path d="M3 3v18h18"/>
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
              </svg>
            </div>
            <p className="ios-body text-ios-placeholder ios-font-text">No agent logs yet</p>
            <p className="ios-caption text-ios-secondary ios-font-text mt-1">
              Add a log to track manual interventions
            </p>
          </div>
        ) : (
          sortedLogs.map((log) => {
            const colors = levelColors[log.level as LogLevel];
            const icon = levelIcons[log.level as LogLevel];

            return (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-ios bg-white hover:shadow-sm transition-shadow ios"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colors.bg}`}>
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
