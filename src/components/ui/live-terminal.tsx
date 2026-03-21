'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';

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
    // @ts-expect-error - CSS modules might not have declarations
    await import('@xterm/xterm/css/xterm.css');

    // Resolve theme colors from CSS variables
    const styles = getComputedStyle(document.documentElement);
    const terminalBg = styles.getPropertyValue('--terminal-bg').trim() || 'transparent';
    const terminalText = styles.getPropertyValue('--terminal-text').trim() || 'rgb(161, 161, 170)';
    const accentViolet = styles.getPropertyValue('--accent-violet').trim() || 'rgb(124, 92, 252)';
    const statusEmerald = styles.getPropertyValue('--status-emerald').trim() || 'rgb(5, 150, 105)';
    const statusRed = styles.getPropertyValue('--status-red').trim() || 'rgb(220, 38, 38)';
    const phosphorAmber = styles.getPropertyValue('--phosphor-amber').trim() || 'rgb(255, 179, 0)';
    const terminalGreen = styles.getPropertyValue('--terminal-green').trim() || 'rgb(57, 255, 20)';

    const terminal = new Terminal({
      theme: {
        background: terminalBg,
        foreground: terminalText,
        cursor: accentViolet,
        selectionBackground: `${accentViolet}40`,
        black: 'rgb(10, 10, 11)',
        green: statusEmerald,
        yellow: phosphorAmber,
        blue: accentViolet,
        red: statusRed,
        brightGreen: terminalGreen,
        brightYellow: phosphorAmber,
        brightBlue: accentViolet,
      },

      fontFamily: '"Berkeley Mono", "Fira Code", "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
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
      terminal.write('\r\n\x1b[35m> DAEMON CONNECTED\x1b[0m\r\n');
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
      className={`terminal-surface ${className ?? ''}`}
      style={{
        height,
        transform: 'translateZ(0)',
        borderRadius: '0.375rem',
        overflow: 'hidden',
      }}
      ref={containerRef}
    />
  );
}
