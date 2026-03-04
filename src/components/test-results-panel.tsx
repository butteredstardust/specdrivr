import { TestResultSelect } from '@/db/schema';

interface TestResultsPanelProps {
  testResults: TestResultSelect[];
}

export function TestResultsPanel({ testResults }: TestResultsPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>

      {testResults.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No test results yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {testResults.map((result) => (
            <div
              key={result.id}
              className={`
                rounded-lg p-4 border-l-4
                ${result.success
                  ? 'bg-green-50 border-l-green-500'
                  : 'bg-red-50 border-l-red-500'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${result.success
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    }
                  `}
                >
                  {result.success ? 'PASSED' : 'FAILED'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(result.timestamp).toLocaleString()}
                </span>
              </div>

              {result.logs && (
                <div className="mt-3">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                      View Logs
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-900 text-green-400 text-xs rounded overflow-x-auto">
{result.logs}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
