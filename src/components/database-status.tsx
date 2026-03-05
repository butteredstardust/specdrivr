'use client';

import { useState, useEffect } from 'react';

type DbStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function DatabaseStatus() {
  const [status, setStatus] = useState<DbStatus>('connecting');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkConnection = async () => {
    try {
      setStatus('connecting');
      const response = await fetch('/api/health/db', { cache: 'no-store' });

      if (response.ok) {
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
    } catch (error) {
      console.error('Database connection check failed:', error);
      setStatus('error');
    } finally {
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 60000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    connecting: {
      dot: 'bg-status-warning',
      color: 'text-status-warning',
      label: 'Connecting...',
    },
    connected: {
      dot: 'bg-status-success',
      color: 'text-text-primary',
      label: 'Connected',
    },
    disconnected: {
      dot: 'bg-status-idle',
      color: 'text-text-secondary',
      label: 'Disconnected',
    },
    error: {
      dot: 'bg-status-error',
      color: 'text-status-error',
      label: 'Error',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className="flex items-center gap-[6px] px-2 py-1"
      title="PostgreSQL database connection status"
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot} ${status === 'connecting' ? 'animate-pulse' : ''}`}
      />
      <div className="flex items-center gap-[8px] text-[12px]">
        <span className={`font-medium ${config.color}`}>
          {config.label}
        </span>
        {lastCheck && (
          <span className="text-[11px] text-text-tertiary">
            {lastCheck.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
