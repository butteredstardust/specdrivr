import { cn } from '@/lib/utils';

type Expression = 'idle' | 'working' | 'success' | 'blocked' | 'error';

interface DaemonMascotProps {
  expression?: Expression;
  size?: number;
  className?: string;
}

function renderEyes(expression: Expression): React.ReactNode {
  const eyeColor = 'var(--phosphor-amber)';
  switch (expression) {
    case 'idle':
      return (
        <>
          <ellipse cx="12" cy="22" rx="2.5" ry="2.5" fill={eyeColor} />
          <ellipse cx="22" cy="22" rx="2.5" ry="2.5" fill={eyeColor} />
        </>
      );
    case 'working':
      return (
        <>
          <ellipse cx="12" cy="22" rx="2.5" ry="2.5" fill={eyeColor} className="animate-blink" />
          <ellipse cx="22" cy="22" rx="2.5" ry="2.5" fill={eyeColor} />
        </>
      );
    case 'success':
      return (
        <>
          <ellipse cx="12" cy="22" rx="2" ry="1.5" fill={eyeColor} />
          <ellipse cx="22" cy="22" rx="2" ry="1.5" fill={eyeColor} />
          <path d="M11 26 Q17 29 23 26" stroke={eyeColor} strokeWidth="1" fill="none" />
        </>
      );
    case 'blocked':
      return (
        <>
          <line x1="10" y1="22" x2="14" y2="22" stroke={eyeColor} strokeWidth="1.5" />
          <line x1="20" y1="22" x2="24" y2="22" stroke={eyeColor} strokeWidth="1.5" />
        </>
      );
    case 'error':
      return (
        <>
          <line x1="10" y1="20" x2="14" y2="24" stroke={eyeColor} strokeWidth="1.5" />
          <line x1="14" y1="20" x2="10" y2="24" stroke={eyeColor} strokeWidth="1.5" />
          <line x1="20" y1="20" x2="24" y2="24" stroke={eyeColor} strokeWidth="1.5" />
          <line x1="24" y1="20" x2="20" y2="24" stroke={eyeColor} strokeWidth="1.5" />
        </>
      );
    default:
      return null;
  }
}

export function DaemonMascot({
  expression = 'idle',
  size = 32,
  className,
}: DaemonMascotProps): React.ReactElement {
  const isAnimatedAntenna = expression === 'idle' || expression === 'working';
  const gradientId = `daemon-gradient-${expression}`;

  const renderTier = (): React.ReactNode => {
    if (size <= 16) {
      return (
        <g data-tier="silhouette">
          <rect x="4" y="8" width="26" height="30" rx="6" fill="var(--accent-violet)" />
        </g>
      );
    }

    if (size <= 24) {
      return (
        <g data-tier="simplified">
          <rect x="4" y="12" width="26" height="22" rx="8" fill="var(--accent-violet)" />
          <circle cx="12" cy="22" r="2.5" fill="var(--phosphor-amber)" />
          <circle cx="22" cy="22" r="2.5" fill="var(--phosphor-amber)" />
        </g>
      );
    }

    return (
      <g data-tier="full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-violet)" />
            <stop offset="50%" stopColor="var(--accent-violet)" />
            <stop offset="100%" stopColor="var(--accent-violet-dim)" />
          </linearGradient>
        </defs>

        {/* Antenna wire */}
        <line x1="17" y1="12" x2="17" y2="7" stroke="var(--accent-violet)" strokeWidth="2" />
        {/* Antenna dot */}
        <circle
          cx="17"
          cy="6"
          r="2.5"
          fill="var(--phosphor-amber)"
          className={isAnimatedAntenna ? 'animate-pulse' : undefined}
        />

        {/* Body */}
        <rect x="4" y="12" width="26" height="22" rx="10" fill={`url(#${gradientId})`} />

        {/* Head / screen panel */}
        <rect x="7" y="15" width="20" height="14" rx="4" fill="var(--bg-base)" />

        {/* Eyes */}
        {renderEyes(expression)}

        {/* Feet */}
        <rect x="8" y="33" width="7" height="5" rx="2.5" fill="var(--accent-violet-dim)" />
        <rect x="19" y="33" width="7" height="5" rx="2.5" fill="var(--accent-violet-dim)" />
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 34 40"
      width={size}
      height={size * (40 / 34)}
      className={cn('shrink-0 drop-shadow-sm', className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {renderTier()}
    </svg>
  );
}
