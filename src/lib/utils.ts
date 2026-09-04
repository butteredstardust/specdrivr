import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Clock-style elapsed time: MM:SS, promoted to H:MM:SS past the hour.
 *
 * Session durations used to be formatted inline in three places, all of which
 * divided straight into minutes — a multi-hour run rendered as a five-digit
 * minute count ("249562:02") that reads as a glitch rather than a duration.
 */
export function formatElapsed(totalSeconds: number): string {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(secs / 3600);
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mm}:${ss}`;
}
