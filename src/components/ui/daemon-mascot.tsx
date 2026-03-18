import { cn } from '@/lib/utils';

type Expression = 'idle' | 'working' | 'success' | 'blocked' | 'error';

interface DaemonMascotProps {
  expression?: Expression;
  size?: number;
  className?: string;
}

function renderEyes(expression: Expression): React.ReactNode {
  switch (expression) {
    case 'idle':
      return (
        <>
          <ellipse cx="12" cy="22" rx="2" ry="2.5" fill="#ffb300" />
          <ellipse cx="22" cy="22" rx="2" ry="2.5" fill="#ffb300" />
        </>
      );
    case 'working':
      return (
        <>
          <ellipse cx="12" cy="22" rx="2" ry="2.5" fill="#ffb300" className="animate-blink" />
          <ellipse cx="22" cy="22" rx="2" ry="2.5" fill="#ffb300" />
        </>
      );
    case 'success':
      return (
        <>
          <ellipse cx="12" cy="22" rx="2" ry="1.5" fill="#ffb300" />
          <ellipse cx="22" cy="22" rx="2" ry="1.5" fill="#ffb300" />
          <path d="M11 26 Q17 29 23 26" stroke="#ffb300" strokeWidth="1" fill="none" />
        </>
      );
    case 'blocked':
      return (
        <>
          <line x1="10" y1="22" x2="14" y2="22" stroke="#ffb300" strokeWidth="1.5" />
          <line x1="20" y1="22" x2="24" y2="22" stroke="#ffb300" strokeWidth="1.5" />
        </>
      );
    case 'error':
      return (
        <>
          <line x1="10" y1="20" x2="14" y2="24" stroke="#ffb300" strokeWidth="1.5" />
          <line x1="14" y1="20" x2="10" y2="24" stroke="#ffb300" strokeWidth="1.5" />
          <line x1="20" y1="20" x2="24" y2="24" stroke="#ffb300" strokeWidth="1.5" />
          <line x1="24" y1="20" x2="20" y2="24" stroke="#ffb300" strokeWidth="1.5" />
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
          <rect x="4" y="8" width="26" height="30" rx="6" fill="#9b7ffd" />
        </g>
      );
    }

    if (size <= 24) {
      return (
        <g data-tier="simplified">
          <rect x="4" y="12" width="26" height="22" rx="8" fill="#9b7ffd" />
          <circle cx="12" cy="22" r="2.5" fill="#ffb300" />
          <circle cx="22" cy="22" r="2.5" fill="#ffb300" />
        </g>
      );
    }

    return (
      <g data-tier="full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9b7ffd" />
            <stop offset="50%" stopColor="#7c5cfc" />
            <stop offset="100%" stopColor="#5b3fd4" />
          </linearGradient>
        </defs>

        {/* Antenna wire */}
        <line x1="17" y1="12" x2="17" y2="7" stroke="#9b7ffd" strokeWidth="2" />
        {/* Antenna dot */}
        <circle
          cx="17"
          cy="6"
          r="2.5"
          fill="#ffb300"
          className={isAnimatedAntenna ? 'animate-pulse' : undefined}
        />

        {/* Body */}
        <rect x="4" y="12" width="26" height="22" rx="10" fill={`url(#${gradientId})`} />

        {/* Head / screen panel */}
        <rect x="7" y="15" width="20" height="14" rx="4" fill="#1a1025" />

        {/* Eyes */}
        {renderEyes(expression)}

        {/* Feet */}
        <rect x="8" y="33" width="7" height="5" rx="2.5" fill="#5b3fd4" />
        <rect x="19" y="33" width="7" height="5" rx="2.5" fill="#5b3fd4" />
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
