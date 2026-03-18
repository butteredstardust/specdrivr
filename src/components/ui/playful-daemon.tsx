'use client';

import { useEffect, useState, useCallback } from 'react';
import { DaemonMascot } from './daemon-mascot';
import { cn } from '@/lib/utils';

type MascotState =
  | 'idle'
  | 'jumping'
  | 'waving'
  | 'sparking'
  | 'glitch'
  | 'scan'
  | 'reboot'
  | 'spin'
  | 'pulse'
  | 'tilt'
  | 'thruster'
  | 'bounce'
  | 'think'
  | 'sleep';

export function PlayfulDaemon({ size = 32 }: { size?: number }) {
  const [state, setState] = useState<MascotState>('idle');
  const [expression, setExpression] = useState<'idle' | 'success'>('idle');
  const [sparkPos, setSparkPos] = useState({ x: 0, y: 0 });

  const triggerRandomAnimation = useCallback(() => {
    const roll = Math.random();

    if (roll < 0.12) {
      // Jump
      setState('jumping');
      setExpression('success');
      setTimeout(() => {
        setState('idle');
        setExpression('idle');
      }, 600);
    } else if (roll < 0.24) {
      // Wave
      setState('waving');
      setExpression('success');
      setTimeout(() => {
        setState('idle');
        setExpression('idle');
      }, 1500);
    } else if (roll < 0.36) {
      // Glitch
      setState('glitch');
      setTimeout(() => setState('idle'), 400);
    } else if (roll < 0.48) {
      // Scan
      setState('scan');
      setTimeout(() => setState('idle'), 1000);
    } else if (roll < 0.6) {
      // Reboot
      setState('reboot');
      setTimeout(() => setState('idle'), 1500);
    } else if (roll < 0.72) {
      // Spin
      setState('spin');
      setExpression('success');
      setTimeout(() => {
        setState('idle');
        setExpression('idle');
      }, 800);
    } else if (roll < 0.84) {
      // Pulse
      setState('pulse');
      setExpression('success');
      setTimeout(() => {
        setState('idle');
        setExpression('idle');
      }, 1000);
    } else if (roll < 0.86) {
      // Tilt (Curious)
      setState('tilt');
      setTimeout(() => setState('idle'), 1000);
    } else if (roll < 0.88) {
      // Thruster
      setState('thruster');
      setTimeout(() => setState('idle'), 1500);
    } else if (roll < 0.91) {
      // Bounce
      setState('bounce');
      setTimeout(() => setState('idle'), 1200);
    } else if (roll < 0.94) {
      // Think
      setState('think');
      setTimeout(() => setState('idle'), 3000);
    } else if (roll < 0.97) {
      // Sleep
      setState('sleep');
      setTimeout(() => setState('idle'), 4000);
    } else if (roll < 0.99) {
      // Spark
      setState('sparking');
      setSparkPos({
        x: Math.random() * 40 - 20,
        y: Math.random() * 40 - 20,
      });
      setTimeout(() => setState('idle'), 800);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(triggerRandomAnimation, 10000);
    return () => clearInterval(interval);
  }, [triggerRandomAnimation]);

  return (
    <div className="relative flex h-10 w-10 items-center justify-center">
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          state === 'idle' && 'animate-daemon-float',
          state === 'jumping' && 'animate-daemon-jump',
          state === 'waving' && 'animate-daemon-wave',
          state === 'glitch' && 'animate-daemon-glitch',
          state === 'scan' && 'animate-daemon-scan',
          state === 'reboot' && 'animate-daemon-reboot',
          state === 'spin' && 'animate-daemon-spin',
          state === 'pulse' && 'animate-daemon-pulse',
          state === 'tilt' && 'animate-daemon-tilt',
          state === 'thruster' && 'animate-daemon-thruster',
          state === 'bounce' && 'animate-daemon-bounce',
          state === 'think' && 'animate-daemon-think',
          state === 'sleep' && 'animate-daemon-sleep'
        )}
      >
        <DaemonMascot size={size} expression={expression === 'success' ? 'success' : 'idle'} />
      </div>

      {state === 'sparking' && (
        <div
          className="pointer-events-none absolute"
          style={{ transform: `translate(${sparkPos.x}px, ${sparkPos.y}px)` }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" className="animate-daemon-spark">
            <path
              d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z"
              fill="var(--phosphor-amber)"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
