'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type DbStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function DatabaseStatus() {
  const [status, setStatus] = useState<DbStatus>('connecting');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Check database connection
  const checkConnection = async () => {
    try {
      setStatus('connecting');
      const response = await fetch('/api/health/db', {
        cache: 'no-store',
      });

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

  // Check connection immediately and every minute
  useEffect(() => {
    checkConnection();

    const interval = setInterval(checkConnection, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    connecting: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-700',
      indicator: '⏳',
      label: 'Connecting...',
    },
    connected: {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700',
      indicator: '🟢',
      label: 'Connected',
    },
    disconnected: {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-700',
      indicator: '🔴',
      label: 'Disconnected',
    },
    error: {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-700',
      indicator: '⚠️',
      label: 'Error',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border',
        config.bg,
        config.borderColor,
        config.color
      )}
      title="PostgreSQL database connection status"
    >
      <span className="animate-pulse">{config.indicator}</span>
      <div className="flex flex-col">
        <span className="text-xs font-semibold">{config.label}</span>
        {lastCheck && (
          <span className="text-[10px] opacity-70">
            {lastCheck.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
