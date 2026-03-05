'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
      cssVar: '--ios-status-connecting',
      indicator: '⏳',
      label: 'Connecting...',
    },
    connected: {
      cssVar: '--ios-status-connected',
      indicator: '●',
      label: 'Connected',
    },
    disconnected: {
      cssVar: '--ios-status-disconnected',
      indicator: '●',
      label: 'Disconnected',
    },
    error: {
      cssVar: '--ios-status-error',
      indicator: '⚠',
      label: 'Error',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 ios-radius border border-opacity-12',
        'bg-ios-secondary'
      )}
      title="PostgreSQL database connection status"
    >
      <span className="animate-pulse ios-body" style={{ color: `var(${config.cssVar})` }}>
        {config.indicator}
      </span>
      <div className="flex flex-col ios-font-text">
        <span className="text-[13px] font-semibold text-ios-primary">
          {config.label}
        </span>
        {lastCheck && (
          <span className="text-[11px] text-ios-placeholder">
            {lastCheck.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
