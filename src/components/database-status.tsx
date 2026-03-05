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
      dot: 'bg-[#FFAB00]', // Yellow for connecting
      label: 'Connecting...',
    },
    connected: {
      dot: 'bg-[#57D9A3]', // Mint for connected
      label: 'Connected',
    },
    disconnected: {
      dot: 'bg-[#FF8F73]', // Red/Peach for disconnected
      label: 'Disconnected',
    },
    error: {
      dot: 'bg-[#AE2A19]', // Dark red for error
      label: 'Error',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className="flex items-center gap-[5px] px-[8px] py-[3px] bg-white/15 text-white font-medium text-[11px] rounded-[var(--radius-full)]"
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
