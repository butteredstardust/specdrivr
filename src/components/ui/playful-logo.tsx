'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function PlayfulLogo() {
  const [effect, setEffect] = useState<'none' | 'glitch' | 'spark'>('none');

  useEffect(() => {
    const triggerEffect = () => {
      // Randomly pick between glitch and spark
      const nextEffect = Math.random() > 0.5 ? 'glitch' : 'spark';
      setEffect(nextEffect);

      // Duration of the effect - make it longer to be noticeable
      const duration = nextEffect === 'glitch' ? 800 : 500;

      setTimeout(() => {
        setEffect('none');
      }, duration);
    };

    // Trigger every 30 seconds
    const interval = setInterval(triggerEffect, 30000);

    // Initial trigger after 2 seconds for immediate feedback
    const initialTimeout = setTimeout(triggerEffect, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  return (
    <span
      className={cn(
        'text-text-primary flex-1 font-mono text-lg font-bold tracking-tight',
        effect === 'none' && 'transition-all duration-300',
        effect === 'glitch' && 'animate-logo-glitch',
        effect === 'spark' && 'animate-logo-spark'
      )}
    >
      specdrivr
    </span>
  );
}
