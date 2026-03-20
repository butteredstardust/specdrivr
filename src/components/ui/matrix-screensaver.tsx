'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MatrixScreensaverProps {
  className?: string;
  // Props retained for API compatibility; Ghost in the Machine has fixed palette
  color?: string;
  backgroundColor?: string;
}

/**
 * "Ghost in the Machine" — Concept #5
 *
 * A purely white background with slowly falling black characters.
 * Half the speed of classic Matrix, giving it an eerie, quiet quality.
 * When a column finishes, it leaves ghost-traces (low opacity echoes).
 * No green, no glow. Unsettling in its stillness.
 */
export function MatrixScreensaver({ className }: MatrixScreensaverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const fontSize = 14;
    // Classic matrix characters — rendered in cold monochrome
    const chars = '01アウエオカキクケコサシスセソタチツテトナニヌネノ'.split('');

    // Ghost echoes: columns that have finished their run and leave faint traces
    interface GhostColumn {
      x: number;
      chars: string[];
      alpha: number; // fades from ~0.08 to 0
    }

    let columns = Math.floor(width / fontSize);

    // Drop: current head position for each column (in rows). null = inactive
    const heads: (number | null)[] = Array.from({ length: columns }, () =>
      Math.random() > 0.4 ? Math.floor(Math.random() * -60) : null
    );

    // Speed: each column falls at its own leisurely pace (rows per tick)
    const speeds: number[] = Array.from({ length: columns }, () => 0.15 + Math.random() * 0.25);

    // Trail length for each column (in character rows)
    const trailLengths: number[] = Array.from(
      { length: columns },
      () => 6 + Math.floor(Math.random() * 10)
    );

    // Ghost echoes of completed columns
    const ghosts: GhostColumn[] = [];

    // Per-cell character cache so individual chars don't flicker on every frame
    // Each column stores the last character drawn at each row
    const colChars: string[][] = Array.from({ length: columns }, () => []);

    const getChar = (col: number, row: number): string => {
      // Assign a character the first time, rarely refresh it
      if (!colChars[col][row] || Math.random() < 0.03) {
        colChars[col][row] = chars[Math.floor(Math.random() * chars.length)];
      }
      return colChars[col][row];
    };

    const draw = () => {
      // White background — clean and clinical
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "SF Mono", "Fira Mono", "Cascadia Code", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const maxRows = Math.ceil(height / fontSize);

      // 1. Draw ghost echoes first (behind active columns)
      for (let g = ghosts.length - 1; g >= 0; g--) {
        const ghost = ghosts[g];
        ghost.alpha -= 0.003; // very slow fade
        if (ghost.alpha <= 0) {
          ghosts.splice(g, 1);
          continue;
        }
        ctx.globalAlpha = ghost.alpha;
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        const rows = Math.min(ghost.chars.length, maxRows);
        for (let r = 0; r < rows; r++) {
          ctx.fillText(ghost.chars[r], ghost.x, r * fontSize + fontSize / 2);
        }
      }
      ctx.globalAlpha = 1.0;

      // 2. Draw active falling columns
      for (let col = 0; col < heads.length; col++) {
        const headRow = heads[col];
        if (headRow === null) continue;

        const x = col * fontSize + fontSize / 2;
        const trail = trailLengths[col];

        for (let t = 0; t <= trail; t++) {
          const row = Math.floor(headRow) - t;
          if (row < 0 || row > maxRows) continue;

          // Opacity: head is most opaque, tail fades to near-invisible
          const ratio = 1 - t / trail;
          const opacity = ratio * ratio; // quadratic falloff, more tail fade

          // Tip of the column: slightly lighter grey to create a "leading edge"
          if (t === 0) {
            ctx.fillStyle = 'rgba(80, 80, 80, 1)';
            ctx.globalAlpha = 0.9;
          } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.globalAlpha = Math.max(0.03, opacity * 0.85);
          }

          ctx.fillText(getChar(col, row), x, row * fontSize + fontSize / 2);
        }
        ctx.globalAlpha = 1.0;

        // Advance head
        heads[col] = (headRow as number) + speeds[col];

        // Column has exited the canvas — spawn a ghost and reset
        const bottomEdge = Math.floor(headRow) - trail;
        if (bottomEdge > maxRows) {
          // Capture ghost echo
          const ghostChars: string[] = [];
          for (let r = 0; r < maxRows; r++) {
            ghostChars.push(getChar(col, r));
          }
          ghosts.push({ x, chars: ghostChars, alpha: 0.06 });

          // Random pause before restarting this column
          if (Math.random() > 0.3) {
            heads[col] = Math.floor(Math.random() * -60);
            // Refresh column character cache
            colChars[col] = [];
            trailLengths[col] = 6 + Math.floor(Math.random() * 10);
            speeds[col] = 0.15 + Math.random() * 0.25;
          } else {
            heads[col] = null; // stays dark for a while
            setTimeout(
              () => {
                if (heads[col] === null) {
                  heads[col] = Math.floor(Math.random() * -60);
                  colChars[col] = [];
                  trailLengths[col] = 6 + Math.floor(Math.random() * 10);
                  speeds[col] = 0.15 + Math.random() * 0.25;
                }
              },
              2000 + Math.random() * 6000
            );
          }
        }
      }
    };

    // Slower tick than classic Matrix — eerie, deliberate
    const intervalId = setInterval(draw, 50);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;

      const newColumns = Math.floor(width / fontSize);
      if (newColumns > columns) {
        for (let i = columns; i < newColumns; i++) {
          heads[i] = Math.random() > 0.4 ? Math.floor(Math.random() * -60) : null;
          speeds[i] = 0.15 + Math.random() * 0.25;
          trailLengths[i] = 6 + Math.floor(Math.random() * 10);
          colChars[i] = [];
        }
      } else {
        heads.length = newColumns;
        speeds.length = newColumns;
        trailLengths.length = newColumns;
        colChars.length = newColumns;
      }
      columns = newColumns;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('block h-full w-full', className)}
      style={{ background: '#ffffff' }}
    />
  );
}
