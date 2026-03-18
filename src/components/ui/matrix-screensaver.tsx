'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MatrixScreensaverProps {
  className?: string;
  color?: string;
  backgroundColor?: string;
}

export function MatrixScreensaver({
  className,
  color = 'var(--accent-violet)',
  backgroundColor = 'rgba(13, 13, 10, 0.15)', // --terminal-bg with opacity
}: MatrixScreensaverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resolve CSS variables to actual colors for canvas drawing
    const styles = getComputedStyle(document.documentElement);
    const resolvedColor = color.startsWith('var(')
      ? styles.getPropertyValue(color.slice(4, -1)).trim()
      : color;
    const amberColor = styles.getPropertyValue('--phosphor-amber').trim();

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const letters = '○▶⚠✕✓$@#!01'.split('');
    const fontSize = 16;

    // Map of the Daemon silhouette (14x16 grid for better visibility)
    // 1 = body, 2 = antenna, 3 = eyes, 4 = mouth
    const daemonMap = [
      [0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 1, 1],
      [1, 1, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1],
      [1, 1, 1, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
    ];

    // State for background rain
    let columns = Math.floor(width / fontSize);
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    const draw = () => {
      // Draw semi-transparent background to create the iconic Matrix trail effect
      ctx.fillStyle = 'rgba(13, 13, 10, 0.2)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 1. Draw ambient background rain (Classic Matrix style but subtle)
      ctx.globalAlpha = 0.15; // Keep background rain very faint
      for (let i = 0; i < drops.length; i++) {
        const char = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillStyle = Math.random() > 0.98 ? amberColor : resolvedColor;

        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      ctx.globalAlpha = 1.0;

      // 2. Draw centered mascot (The focal point)
      const mapWidth = daemonMap[0].length;
      const mapHeight = daemonMap.length;

      const startX = (width - mapWidth * fontSize) / 2 + fontSize / 2;
      const startY = (height - mapHeight * fontSize) / 2 + fontSize / 2;

      for (let row = 0; row < mapHeight; row++) {
        for (let col = 0; col < mapWidth; col++) {
          const type = daemonMap[row][col];
          if (type === 0) continue;

          const x = startX + col * fontSize;
          const y = startY + row * fontSize;
          const char = letters[Math.floor(Math.random() * letters.length)];

          if (type === 3) {
            // Eyes - Amber
            ctx.fillStyle = amberColor;
          } else if (type === 4) {
            // Mouth - Happy Smile (Amber)
            ctx.fillStyle = amberColor;
          } else if (type === 2) {
            // Antenna - Occasional flicker
            ctx.fillStyle = Math.random() > 0.1 ? resolvedColor : amberColor;
          } else {
            // Body - Violet with slight flicker
            ctx.fillStyle = resolvedColor;
            ctx.globalAlpha = Math.random() > 0.05 ? 1.0 : 0.6;
          }

          ctx.fillText(char, x, y);
          ctx.globalAlpha = 1.0;
        }
      }
    };

    const intervalId = setInterval(draw, 200);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      const newColumns = Math.floor(width / fontSize);

      // Expand or shrink drops array smoothly
      if (newColumns > columns) {
        for (let i = columns; i < newColumns; i++) {
          drops[i] = Math.random() * -100;
        }
      } else {
        drops.length = newColumns;
      }
      columns = newColumns;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, [color, backgroundColor]);

  return <canvas ref={canvasRef} className={cn('block h-full w-full', className)} />;
}
