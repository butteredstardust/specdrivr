'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import { cn } from '@/lib/utils';

interface LiveTerminalProps {
  sessionId: number;
  height?: number; // px, default 320
  className?: string;
  active?: boolean; // pause rendering when not visible
}

export function LiveTerminal({
  sessionId,
  height = 320,
  className,
  active = true,
}: LiveTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isAtBottomRef = useRef(true);

  const initTerminal = useCallback(async () => {
    if (!containerRef.current || terminalRef.current) return;

    // Dynamic imports — never at module scope
    const { Terminal } = await import('@xterm/xterm');
    const { FitAddon } = await import('@xterm/addon-fit');
    const { WebLinksAddon } = await import('@xterm/addon-web-links');

    // Import xterm CSS dynamically
    await import('@xterm/xterm/css/xterm.css');

    /**
     * xterm needs literal colours, so the design tokens are read off the
     * document at init. `token()` keeps the fallbacks in one place; they only
     * apply if globals.css failed to load, in which case any value is a guess.
     *
     * These are the neutral log tokens, not the old phosphor/terminal-green
     * set — the log surface is now a dark mono panel, not a CRT.
     */
    const styles = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) =>
      styles.getPropertyValue(name).trim() || fallback;

    const logBg = token('--log-bg', '#0f1116');
    const logText = token('--log-text', '#f2f4f7');
    const logMuted = token('--log-muted', '#737d8c');
    const accent = token('--accent', '#4d8dfa');
    const success = token('--success', '#067647');
    const warning = token('--warning', '#b54708');
    const danger = token('--danger', '#b42318');

    const terminal = new Terminal({
      theme: {
        background: logBg,
        foreground: logText,
        cursor: accent,
        selectionBackground: `${accent}40`,
        black: logBg,
        brightBlack: logMuted,
        green: success,
        brightGreen: success,
        yellow: warning,
        brightYellow: warning,
        red: danger,
        brightRed: danger,
        blue: accent,
        brightBlue: accent,
      },

      // Resolved, not `var(--font-mono)` — xterm builds a canvas font string,
      // which does not evaluate custom properties.
      fontFamily: token('--font-mono', '"Fira Code", ui-monospace, monospace'),
      fontSize: 13,
      lineHeight: 1.5,
      cursorBlink: false,
      scrollback: 5000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(containerRef.current);
    fitAddon.fit();

    // Track scroll position — only auto-scroll if already at bottom
    terminal.onScroll(() => {
      const buffer = terminal.buffer.active;
      isAtBottomRef.current = buffer.viewportY + terminal.rows >= buffer.length - 1;
    });

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Resize observer
    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const connectSSE = useCallback(() => {
    if (!terminalRef.current || eventSourceRef.current) return;

    const terminal = terminalRef.current;
    const es = new EventSource(`/api/v1/sessions/${sessionId}/stream`, {
      withCredentials: true,
    });

    es.addEventListener('connected', () => {
      terminal.write('\r\n\x1b[90mConnected.\x1b[0m\r\n');
    });

    es.addEventListener('history_end', () => {
      terminal.write('\x1b[90m── live ──\x1b[0m\r\n');
    });

    es.addEventListener('log', (e) => {
      try {
        const { line, level } = JSON.parse(e.data);

        // Colour-code by level if it's a simple string,
        // but prefer raw write for ANSI compatibility
        let formatted = line;
        if (level === 'error') formatted = `\x1b[31m${line}\x1b[0m`;
        else if (level === 'warn') formatted = `\x1b[33m${line}\x1b[0m`;

        terminal.write(formatted);

        if (isAtBottomRef.current) {
          terminal.scrollToBottom();
        }
      } catch {
        /* ignore malformed events */
      }
    });

    es.addEventListener('error', () => {
      terminal.write('\r\n\x1b[31m> Connection lost. Reconnecting...\x1b[0m\r\n');
      es.close();
      eventSourceRef.current = null;
      // Reconnect after 3s
      setTimeout(connectSSE, 3000);
    });

    eventSourceRef.current = es;
  }, [sessionId]);

  // Init terminal on mount
  useEffect(() => {
    let cleanupFn: (() => void) | undefined;
    initTerminal().then((c) => {
      cleanupFn = c;
    });
    return () => {
      if (cleanupFn) cleanupFn();
      terminalRef.current?.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [initTerminal]);

  // Connect SSE when active
  useEffect(() => {
    if (active && terminalRef.current) {
      connectSSE();
    }
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [active, connectSSE]);

  // Pause rendering when not visible
  useEffect(() => {
    if (containerRef.current && terminalRef.current) {
      containerRef.current.style.visibility = active ? 'visible' : 'hidden';
    }
  }, [active]);

  return (
    <div
      // aria-live so screen readers hear appended output. `polite` because a
      // build log is informational and must not interrupt the current task.
      role="log"
      aria-live="polite"
      aria-label="Session output"
      className={cn(
        'border-line bg-log-bg overflow-hidden rounded-md border p-2',
        // Promotes to its own layer; xterm repaints constantly during a stream.
        'transform-gpu',
        className
      )}
      style={{ height }}
      ref={containerRef}
    />
  );
}
