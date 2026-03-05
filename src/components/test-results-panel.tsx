import { TestResultSelect } from '@/db/schema';
import { CheckCircle2, XCircle, Clock, ChevronDown, List, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestResultsPanelProps {
  testResults: TestResultSelect[];
}

export function TestResultsPanel({ testResults }: TestResultsPanelProps) {
  if (testResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-[var(--sp-12)] border-2 border-dashed border-[var(--color-border-default)] rounded-[var(--radius-lg)] opacity-60">
        <div className="mb-[var(--sp-3)] flex justify-center text-[var(--color-text-tertiary)]">
          <Search size={32} />
        </div>
        <p className="text-[14px] text-[var(--color-text-secondary)] italic">No test results yet.</p>
        <p className="text-[12px] text-[var(--color-text-tertiary)] mt-[var(--sp-1)] uppercase font-bold tracking-tight">
          Log verification steps on a task to see results here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--sp-4)]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Verification History ({testResults.length})
        </span>
      </div>

      <div className="space-y-[var(--sp-3)]">
        {testResults.map((result) => (
          <div
            key={result.id}
            className={cn(
              "bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] p-[var(--sp-4)] border-l-4 transition-all hover:border-[var(--color-border-selected)]",
              result.success
                ? "border-l-[var(--status-success-text)]"
                : "border-l-[var(--status-error-text)]"
            )}
          >
            <div className="flex items-center justify-between mb-[var(--sp-3)]">
              <div className="flex items-center gap-[var(--sp-3)]">
                <span className={cn(
                  "px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold uppercase",
                  result.success
                    ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)]"
                    : "bg-[var(--status-error-bg)] text-[var(--status-error-text)]"
                )}>
                  {result.success ? 'Passed' : 'Failed'}
                </span>
                <span className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-tight">
                  Task SD-{result.taskId}
                </span>
              </div>
              <div className="flex items-center gap-[var(--sp-1)] text-[11px] font-bold text-[var(--color-text-tertiary)]">
                <Clock size={12} />
                <span>{new Date(result.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            </div>

            {result.logs && (
              <details className="group">
                <summary className="cursor-pointer text-[12px] font-bold text-[var(--color-brand-bold)] hover:underline list-none flex items-center gap-1">
                  <List size={14} className="group-open:rotate-180 transition-transform" />
                  View Execution Logs
                </summary>
                <div className="mt-[var(--sp-3)] rounded-[var(--radius-sm)] overflow-hidden border border-[var(--color-border-default)] shadow-sm">
                  <pre className="p-[var(--sp-4)] bg-[var(--color-bg-sunken)] text-[11px] font-mono whitespace-pre-wrap word-break-all max-h-[300px] overflow-y-auto linear-scrollbar">
                    {result.logs}
                  </pre>
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
