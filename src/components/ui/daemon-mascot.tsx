'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type MascotState = 'idle' | 'thinking' | 'error' | 'success' | 'working' | 'blocked';

interface DaemonMascotProps {
  state?: MascotState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function DaemonMascot({ 
  state = 'idle', 
  size = 'md', 
  className 
}: DaemonMascotProps) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  // This is a placeholder for the actual SVG/Animation logic
  // In a real implementation, this would switch between different SVG paths or Lottie animations
  const colorMap = {
    idle: 'bg-indigo-500',
    thinking: 'bg-indigo-400 animate-pulse',
    error: 'bg-red-500',
    blocked: 'bg-yellow-500',
    success: 'bg-emerald-500',
    working: 'bg-blue-500 animate-spin',
  };

  return (
    <div 
      className={cn(
        'relative rounded-full flex items-center justify-center overflow-hidden transition-all duration-300',
        sizeMap[size],
        colorMap[state],
        className
      )}
    >
      <div className="text-white font-bold select-none">
        {state === 'idle' && '◕◡◕'}
        {state === 'thinking' && '⊙_⊙'}
        {state === 'error' && 'ಠ_ಠ'}
        {state === 'blocked' && '>_<'}
        {state === 'success' && '◉◡◉'}
        {state === 'working' && '⚙'}
      </div>
      
      {state === 'thinking' && (
        <div className="absolute inset-0 border-4 border-indigo-200 border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}
