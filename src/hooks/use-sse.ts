import { useEffect, useState, useCallback } from 'react';
import { clientLogger } from '@/lib/logger-client';

type UseSSEOptions = {
  url: string | null; // The REST endpoint to fetch the initial/full data from
  sseUrl: string | null; // The SSE endpoint to listen to
  enabled?: boolean;
};

type UseSSEResult<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  mutate: () => void;
};

export function useSSE<T>({ url, sseUrl, enabled = true }: UseSSEOptions): UseSSEResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [trigger, setTrigger] = useState<number>(0);

  const mutate = useCallback(() => {
    setTrigger((t) => t + 1);
  }, []);

  // 1. Data Fetching Effect
  useEffect(() => {
    if (!enabled || !url) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const response = await fetch(url, { credentials: 'include', signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();
        const payload = json.data !== undefined ? json.data : json;

        if (!isMounted) return;
        setData(payload);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url, enabled, trigger]);

  // 2. SSE Subscription Effect
  useEffect(() => {
    if (!enabled || !sseUrl) return;

    const eventSource = new EventSource(sseUrl, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'update' || parsed.type === 'ping') {
          mutate();
        }
      } catch {
        // ignore
      }
    };

    // Explicitly listen to 'update' events
    eventSource.addEventListener('update', () => {
      mutate();
    });

    eventSource.onerror = () => {
      clientLogger.error(`SSE connection error for ${sseUrl}`);
      // Fallback: trigger a refetch and let it reconnect naturally
      mutate();
    };

    return () => {
      eventSource.close();
    };
  }, [sseUrl, enabled, mutate]);

  return { data, error, isLoading, mutate };
}
