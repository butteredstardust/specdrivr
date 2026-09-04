import { cn } from '@/lib/utils';

interface BrandMarkProps {
  size?: number;
  className?: string;
  label?: string;
}

export function BrandMark({ size = 32, className, label }: BrandMarkProps): React.ReactElement {
  return (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={cn('ring-accent/20 shrink-0 rounded-[22%] ring-1', className)}
      xmlns="http://www.w3.org/2000/svg"
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      <rect width="1024" height="1024" rx="229.07" fill="var(--brand-navy)" />
      <g fill="var(--brand-cyan)" stroke="var(--brand-cyan)" strokeWidth="1.64">
        <polygon points="743.51,421.79 403.50,575.38 504.79,612.47 844.80,458.88" />
        <polygon points="654.59,329.66 403.50,443.08 504.79,480.18 755.88,366.75" />
        <polygon points="474.75,477.05 179.20,610.55 280.49,647.65 576.04,514.14" />
        <polygon points="474.75,344.75 268.12,438.09 369.41,475.18 576.04,381.84" />
      </g>
      <g fill="var(--brand-blue)" stroke="var(--brand-blue)" strokeWidth="1.64">
        <polygon points="844.80,505.58 844.80,458.88 504.79,612.47 504.79,659.17" />
        <polygon points="755.88,413.45 755.88,366.75 504.79,480.18 504.79,526.87" />
        <polygon points="403.50,622.07 504.79,659.17 504.79,612.47 403.50,575.38" />
        <polygon points="403.50,489.78 504.79,526.87 504.79,480.18 403.50,443.08" />
        <polygon points="576.04,560.83 576.04,514.14 280.49,647.65 280.49,694.34" />
        <polygon points="576.04,428.54 576.04,381.84 369.41,475.18 369.41,521.88" />
        <polygon points="268.12,484.78 369.41,521.88 369.41,475.18 268.12,438.09" />
        <polygon points="179.20,657.25 280.49,694.34 280.49,647.65 179.20,610.55" />
      </g>
    </svg>
  );
}

interface BrandLockupProps extends BrandMarkProps {
  compact?: boolean;
}

export function BrandLockup({
  size = 32,
  className,
  compact = false,
}: BrandLockupProps): React.ReactElement {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <BrandMark size={size} />
      {!compact && (
        <span className="text-fg font-mono text-lg font-semibold tracking-[-0.04em]">
          specdrivr
        </span>
      )}
    </div>
  );
}
