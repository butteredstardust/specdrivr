import { useEffect, useState, useCallback, useRef } from 'react';
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
  isRefetching: boolean;
  mutate: () => void;
};

export function useSSE<T>({ url, sseUrl, enabled = true }: UseSSEOptions): UseSSEResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [trigger, setTrigger] = useState<number>(0);

  const isFirstFetchRef = useRef(true);

  const mutate = useCallback(() => {
    setTrigger((t) => t + 1);
  }, []);

  // 1. Data Fetching Effect
  useEffect(() => {
    if (!enabled || !url) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      if (!isFirstFetchRef.current) {
        setIsRefetching(true);
      }

      try {
        const response = await fetch(url, { credentials: 'include', signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();
        const payload = json.data !== undefined ? json.data : json;

        if (!isMounted) return;
        setData(payload);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefetching(false);
          isFirstFetchRef.current = false;
        }
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
    // Track errors per connection attempt; reset on any successful message.
    // This prevents a mutate()-storm when the server repeatedly errors before
    // the browser's native SSE reconnect loop re-establishes the connection.
    const errorCountRef = { current: 0 };
    const MAX_ERROR_MUTATES = 3;

    const handleMessage = (event: MessageEvent) => {
      errorCountRef.current = 0; // reset on any successful message
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'update' || parsed.type === 'ping') {
          mutate();
        }
      } catch {
        // ignore malformed frames
      }
    };

    eventSource.onmessage = handleMessage;

    // Explicitly listen to named 'update' events
    eventSource.addEventListener('update', () => {
      errorCountRef.current = 0;
      mutate();
    });

    eventSource.onerror = () => {
      if (errorCountRef.current < MAX_ERROR_MUTATES) {
        errorCountRef.current += 1;
        clientLogger.error(`SSE connection error for ${sseUrl} (attempt ${errorCountRef.current})`);
        mutate();
      }
      // Beyond MAX_ERROR_MUTATES we let the browser reconnect silently.
    };

    return () => {
      eventSource.close();
    };
  }, [sseUrl, enabled, mutate]);

  return { data, error, isLoading, isRefetching, mutate };
}
