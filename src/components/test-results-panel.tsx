import { TestResultSelect } from '@/db/schema';

interface TestResultsPanelProps {
  testResults: TestResultSelect[];
}

export function TestResultsPanel({ testResults }: TestResultsPanelProps) {
  if (testResults.length === 0) {
    return (
      <div className="text-center py-8 ios">
        <div className="mb-3 flex justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
            <path d="M9 11H15"/>
            <path d="M12 8V14"/>
            <rect width="18" height="18" x="3" y="3" rx="2"/>
          </svg>
        </div>
        <p className="text-[13px] text-text-tertiary ">No test results yet</p>
        <p className="ios-caption text-text-secondary  mt-1">
          Click "Log Test" on a task to add results
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 ios">
      <div className="flex items-center justify-between text-[13px] text-text-secondary ">
        <span>{testResults.length} result{testResults.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-2">
        {testResults.map((result) => (
          <div
            key={result.id}
            className={`
              rounded-ios-md p-3 ios border-l-4
              ${result.success
                ? 'bg-status-success/10 border-l-status-success'
                : 'bg-status-error/10 border-l-status-error'
              }
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className={`
                    px-2 py-0.5 rounded-ios-md text-[11px] font-medium font-medium 
                    ${result.success
                      ? 'bg-status-success/20 text-status-success'
                      : 'bg-status-error/20 text-status-error'
                    }
                  `}
                >
                  {result.success ? 'PASSED' : 'FAILED'}
                </span>
                <span className="ios-caption text-text-secondary ">
                  Task #{result.taskId}
                </span>
              </div>
              <span className="ios-caption text-text-tertiary ">
                {new Date(result.timestamp).toLocaleDateString()} {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {result.logs && (
              <details className="mt-2">
                <summary className="cursor-pointer ios-caption text-accent hover:text-accent/80  inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  View logs
                </summary>
                <pre className="mt-2 p-2 bg-gray-900 text-green-400 text-[11px] font-medium rounded-ios-md overflow-x-auto  font-mono">
{result.logs}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
