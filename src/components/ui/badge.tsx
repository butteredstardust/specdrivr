import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[--accent-violet] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[--accent-violet] text-[--text-primary] shadow hover:bg-[--accent-violet-dim]",
        secondary:
          "border-transparent bg-[--bg-surface] text-[--text-secondary] hover:bg-[--bg-elevated]",
        destructive:
          "border-transparent bg-[--status-red] text-[--text-primary] shadow hover:opacity-80",
        outline: "text-[--text-primary] border-[--border-default]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
