import { TestResultSelect } from '@/db/schema';

interface TestResultsPanelProps {
  testResults: TestResultSelect[];
}

export function TestResultsPanel({ testResults }: TestResultsPanelProps) {
  if (testResults.length === 0) {
    return (
      <div className="text-center py-8 ios">
        <div className="mb-3 flex justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ios-placeholder">
            <path d="M9 11H15"/>
            <path d="M12 8V14"/>
            <rect width="18" height="18" x="3" y="3" rx="2"/>
          </svg>
        </div>
        <p className="ios-body text-ios-placeholder ios-font-text">No test results yet</p>
        <p className="ios-caption text-ios-secondary ios-font-text mt-1">
          Click "Log Test" on a task to add results
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 ios">
      <div className="flex items-center justify-between ios-body text-ios-secondary ios-font-text">
        <span>{testResults.length} result{testResults.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-2">
        {testResults.map((result) => (
          <div
            key={result.id}
            className={`
              rounded-lg p-3 ios border-l-4
              ${result.success
                ? 'bg-green-50 border-l-green-500'
                : 'bg-red-50 border-l-red-500'
              }
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className={`
                    px-2 py-0.5 rounded text-xs font-medium ios-font-text
                    ${result.success
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    }
                  `}
                >
                  {result.success ? 'PASSED' : 'FAILED'}
                </span>
                <span className="ios-caption text-ios-secondary ios-font-text">
                  Task #{result.taskId}
                </span>
              </div>
              <span className="ios-caption text-ios-placeholder ios-font-text">
                {new Date(result.timestamp).toLocaleDateString()} {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {result.logs && (
              <details className="mt-2">
                <summary className="cursor-pointer ios-caption text-ios-blue hover:text-blue-800 ios-font-text inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  View logs
                </summary>
                <pre className="mt-2 p-2 bg-gray-900 text-green-400 text-xs rounded overflow-x-auto ios-font-text font-mono">
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
