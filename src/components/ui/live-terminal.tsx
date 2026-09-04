'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
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
  // xterm arrives through dynamic imports, so the terminal does not exist on
  // the first commit. This has to be state rather than a ref: the SSE effect
  // needs to re-run once the terminal is actually there, and a ref mutation
  // does not schedule that.
  const [isTerminalReady, setIsTerminalReady] = useState(false);

  /**
   * Builds the terminal but publishes nothing: the caller owns `terminalRef`
   * and decides whether this instance is still wanted.
   *
   * The guard used to be `if (terminalRef.current) return`, checked before the
   * dynamic imports are awaited. React mounts effects twice in development, and
   * neither call had assigned the ref yet when the other checked it, so both
   * proceeded and two terminals were opened into the same container — the one
   * being written to was not necessarily the one on screen.
   */
  const initTerminal = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return null;

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

    terminal.open(container);
    fitAddon.fit();

    // Track scroll position — only auto-scroll if already at bottom
    terminal.onScroll(() => {
      const buffer = terminal.buffer.active;
      isAtBottomRef.current = buffer.viewportY + terminal.rows >= buffer.length - 1;
    });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(container);

    return { terminal, fitAddon, dispose: () => resizeObserver.disconnect() };
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

        // One record is one line. Streamed agent output may carry its own
        // trailing newline, but replayed `agent_logs` rows never do, so without
        // this every historical line lands end-to-end on a single row.
        terminal.write(formatted.endsWith('\n') ? formatted : `${formatted}\r\n`);

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
    let cancelled = false;
    let disposeObserver: (() => void) | undefined;

    initTerminal().then((created) => {
      if (!created) return;
      // This mount was already torn down while the imports were in flight, so
      // this instance is orphaned. Dispose it here or it stays in the container
      // as a second, invisible terminal.
      if (cancelled) {
        created.dispose();
        created.terminal.dispose();
        return;
      }
      terminalRef.current = created.terminal;
      fitAddonRef.current = created.fitAddon;
      disposeObserver = created.dispose;
      setIsTerminalReady(true);
    });

    return () => {
      cancelled = true;
      setIsTerminalReady(false);
      disposeObserver?.();
      terminalRef.current?.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [initTerminal]);

  // Connect SSE when active
  useEffect(() => {
    if (active && isTerminalReady) {
      connectSSE();
    }
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [active, isTerminalReady, connectSSE]);

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
