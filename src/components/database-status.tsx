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
      color: 'text-[#FF9500]',
      bg: 'bg-[#F2F2F7] dark:bg-[#2C2C2E]',
      borderColor: 'border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)]',
      indicator: '⏳',
      label: 'Connecting...',
    },
    connected: {
      color: 'text-[#34C759]',
      bg: 'bg-[#F2F2F7] dark:bg-[#2C2C2E]',
      borderColor: 'border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)]',
      indicator: '●',
      label: 'Connected',
    },
    disconnected: {
      color: 'text-[#FF3B30]',
      bg: 'bg-[#F2F2F7] dark:bg-[#2C2C2E]',
      borderColor: 'border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)]',
      indicator: '●',
      label: 'Disconnected',
    },
    error: {
      color: 'text-[#FF3B30]',
      bg: 'bg-[#F2F2F7] dark:bg-[#2C2C2E]',
      borderColor: 'border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)]',
      indicator: '⚠',
      label: 'Error',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-[12px] border',
        config.bg,
        config.borderColor,
        config.color
      )}
      title="PostgreSQL database connection status"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}
    >
      <span className="animate-pulse text-base">{config.indicator}</span>
      <div className="flex flex-col">
        <span className="text-[13px] font-semibold">{config.label}</span>
        {lastCheck && (
          <span className="text-[11px] text-[#8E8E93]">
            {lastCheck.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
