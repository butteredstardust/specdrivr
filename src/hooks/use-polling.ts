import { useState, useEffect, useCallback, useRef } from 'react';
import { clientLogger } from '@/lib/logger-client';

type UsePollingOptions<T> = {
  url: string;                          // endpoint to poll
  interval?: number;                    // ms between polls, default 3000
  enabled?: boolean;                    // pause polling when false
  stopWhen?: (data: T) => boolean;      // stop automatically when condition met
  onData?: (data: T) => void;           // called on each successful response
  onError?: (error: Error) => void;     // called on fetch failure
};

type UsePollingResult<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;                   // true only on first fetch
  lastUpdated: Date | null;
  stop: () => void;                     // manual stop
  restart: () => void;                  // manual restart
};

/**
 * A generic hook for polling API endpoints.
 *
 * @example
 * // Session detail — stop when session completes
 * const { data: session } = usePolling<Session>({
 *   url: `/api/v1/sessions/${id}`,
 *   stopWhen: (s) => s.status === 'completed' || s.status === 'failed',
 * })
 *
 * // Notification count — always poll, manual control
 * const { data, stop } = usePolling<{ unread: number }>({
 *   url: '/api/v1/notifications?unreadOnly=true&limit=1',
 *   interval: 30_000,
 * })
 */
export function usePolling<T>({
  url,
  interval = 3000,
  enabled = true,
  stopWhen,
  onData,
  onError,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStopped, setIsStopped] = useState<boolean>(false);

  const errorCountRef = useRef(0);
  const isFirstFetchRef = useRef(true);

  const stop = useCallback(() => {
    setIsStopped(true);
  }, []);

  const restart = useCallback(() => {
    setIsStopped(false);
    errorCountRef.current = 0;
    isFirstFetchRef.current = true;
    setIsLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    if (!enabled || isStopped) {
      return;
    }

    let isMounted = true;


    const fetchData = async () => {
      try {
        const response = await fetch(url, { credentials: 'include' });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();

        // Handle Specdrivr standard `{ data: T }` envelope
        const payload = json.data !== undefined ? json.data : json;

        if (!isMounted) return;

        setData(payload);
        setLastUpdated(new Date());
        errorCountRef.current = 0; // Reset consecutive errors

        if (isFirstFetchRef.current) {
          setIsLoading(false);
          isFirstFetchRef.current = false;
        }

        if (onData) {
          onData(payload);
        }

        if (stopWhen && stopWhen(payload)) {
          stop();
        }
      } catch (err) {
        if (!isMounted) return;

        errorCountRef.current += 1;
        const currentError = err instanceof Error ? err : new Error(String(err));

        clientLogger.error(`Polling error for ${url}:`, currentError);

        if (errorCountRef.current >= 5) {
          setError(currentError);
          stop();
          if (onError) {
            onError(currentError);
          }
        }
      }
    };

    // Initial fetch
    fetchData();

    const timeoutId = setInterval(fetchData, interval);

    return () => {
      isMounted = false;
      clearInterval(timeoutId);
    };
  }, [url, interval, enabled, isStopped, onData, onError, stopWhen, stop]);

  return {
    data,
    error,
    isLoading,
    lastUpdated,
    stop,
    restart,
  };
}
