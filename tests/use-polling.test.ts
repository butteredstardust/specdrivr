import { renderHook, act } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import { usePolling } from '@/hooks/use-polling';

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('does not fetch when url is null', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderHook(() => usePolling({ url: null }));
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('resumes polling when url changes from null to a string', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ data: { ok: true } }), { status: 200 }));

    const { rerender } = renderHook(({ url }: { url: string | null }) => usePolling({ url }), {
      initialProps: { url: null },
    });
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(fetchSpy).not.toHaveBeenCalled();

    rerender({ url: '/api/v1/test' });
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(fetchSpy).toHaveBeenCalledWith('/api/v1/test', {
      credentials: 'include',
      signal: expect.any(AbortSignal),
    });
  });

  test('stops after 5 consecutive errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    const onError = vi.fn();
    const { result } = renderHook(() =>
      usePolling({ url: '/api/v1/test', interval: 100, onError })
    );
    // Advance through 5 errors. Backoffs will be approx 200, 400, 800, 1600ms + jitter.
    for (let i = 0; i < 5; i++) {
      await act(() => vi.advanceTimersByTimeAsync(2000));
    }
    // onError fires on every error; polling stops after 5 consecutive
    expect(onError).toHaveBeenCalledTimes(5);
    expect(result.current.error).not.toBeNull();
  });

  test('uses clearTimeout for cleanup', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: {} }), { status: 200 })
    );
    const { unmount } = renderHook(() => usePolling({ url: '/api/v1/test', interval: 1000 }));
    // Wait for initial fetch to resolve and schedule the timeout
    await act(() => vi.advanceTimersByTimeAsync(1));
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  test('stopWhen stops polling when predicate returns true', async () => {
    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callCount++;
      return new Response(JSON.stringify({ data: { done: callCount >= 2 } }), { status: 200 });
    });
    const { result } = renderHook(() =>
      usePolling<{ done: boolean }>({
        url: '/api/v1/test',
        interval: 100,
        stopWhen: (d) => d.done,
      })
    );
    await act(() => vi.advanceTimersByTimeAsync(500));
    // waitFor uses setTimeout internally which is mocked — assert directly after flushing
    expect(result.current.data?.done).toBe(true);
    const countAfterStop = callCount;
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(callCount).toBe(countAfterStop);
  });
});
