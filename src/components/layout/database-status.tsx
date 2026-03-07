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
      dot: 'bg-amber-500', // Yellow
      label: 'Connecting...',
    },
    connected: {
      dot: 'bg-emerald-500', // Mint
      label: 'Connected',
    },
    disconnected: {
      dot: 'bg-rose-500', // Red
      label: 'Disconnected',
    },
    error: {
      dot: 'bg-red-600', // Dark red
      label: 'Error',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className="flex items-center gap-[5px] px-[8px] py-[3px] bg-[var(--bg-sunken)] text-[var(--text-secondary)] border border-[var(--border-default)] font-medium text-[11px] rounded-[var(--radius-full)]"
      title="PostgreSQL database connection status"
    >
      <span
        className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${config.dot} ${status === 'connecting' ? 'animate-pulse' : ''}`}
      />
      <span>
        {config.label}
      </span>
      {lastCheck && (
        <span className="opacity-60 font-normal">
          • {lastCheck.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}
