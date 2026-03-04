import { AgentLogSelect } from '@/db/schema';

interface AgentLogsProps {
  logs: AgentLogSelect[];
}

export function AgentLogs({ logs }: AgentLogsProps) {
  const levelColors = {
    debug: 'bg-gray-100 text-gray-700',
    info: 'bg-blue-100 text-blue-700',
    warn: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Agent Activity Logs</h3>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 space-y-2">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No agent logs yet</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
              <span
                className={`px-2 py-1 rounded text-xs font-medium uppercase ${levelColors[log.level]}`}
              >
                {log.level}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{log.message}</p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
