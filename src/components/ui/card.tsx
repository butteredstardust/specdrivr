/**
 * Component Template - Best Practices Example
 *
 * This file demonstrates the standard patterns for creating UI components in Specdrivr.
 * Use this as a reference when building new components.
 *
 * KEY PRINCIPLES:
 * - Server Components by default (no "use client" directive)
 * - Use "use client" ONLY when necessary for interactivity
 * - Strict TypeScript typing (no "any" types)
 * - Design system tokens via CSS variables (no hardcoded colors)
 * - Compound component pattern for complex components
 * - Consistent with Linear design system patterns
 */

import { cn } from '@/lib/utils';
import React from 'react';

// ============================================
// Type Definitions
// ============================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional: Show border on the card
   * @default true
   */
  bordered?: boolean;
  /**
   * Background variant - matches design system
   * @default 'surface'
   */
  variant?: 'surface' | 'raised' | 'glass';
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional: Show divider below header
   * @default false
   */
  divider?: boolean;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Title size - follows heading hierarchy
   * @default 'h3'
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;


export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional: Padding size
   * @default 'md'
   */
  padding?: 'sm' | 'md' | 'lg';
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Align footer content
   * @default 'end'
   */
  align?: 'start' | 'center' | 'end' | 'apart';
}

// ============================================
// Helper Functions
// ============================================

/**
 * Maps variant to background CSS variable
 */
const getVariantStyles = (variant: CardProps['variant']) => {
  switch (variant) {
    case 'surface':
      return 'bg-[var(--bg-surface)]';
    case 'raised':
      return 'bg-[var(--bg-raised)]';
    case 'glass':
      return 'bg-[var(--bg-glass)] backdrop-blur-sm';
    default:
      return 'bg-[var(--bg-surface)]';
  }
};

/**
 * Maps padding size to Tailwind classes
 */
const getPaddingStyles = (padding: CardContentProps['padding']) => {
  switch (padding) {
    case 'sm':
      return 'p-3';
    case 'md':
      return 'p-4';
    case 'lg':
      return 'p-6';
    default:
      return 'p-4';
  }
};

/**
 * Maps alignment to flexbox classes
 */
const getFooterAlignment = (align: CardFooterProps['align']) => {
  switch (align) {
    case 'start':
      return 'justify-start';
    case 'center':
      return 'justify-center';
    case 'end':
      return 'justify-end';
    case 'apart':
      return 'justify-between';
    default:
      return 'justify-end';
  }
};

// ============================================
// Main Card Component
// ============================================

/**
 * Card - Main container component
 *
 * @example
 * // Basic usage
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Project Details</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Content goes here</p>
 *   </CardContent>
 * </Card>
 *
 * @example
 * // With variants
 * <Card variant="raised" bordered={false}>
 *   <CardContent padding="lg">
 *     <p>Raised card with large padding</p>
 *   </CardContent>
 * </Card>
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'surface', bordered = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Layout
          'relative rounded-lg',
          // Typography
          'text-[--text-primary]',
          // Variant background
          getVariantStyles(variant),
          // Border (optional, using design system)
          bordered && 'border border-[--border-default]',
          // Shadow (consistent with design system)
          'shadow-sm',
          // Hover effect (subtle, for interactive feel)
          'transition-shadow duration-200',
          'hover:shadow-md',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// ============================================
// Card Header Component
// ============================================

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, divider = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Layout
          'flex flex-col space-y-1.5 p-6 pb-4',
          // Optional divider
          divider && 'border-b border-[--border-muted]',
          className
        )}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

// ============================================
// Card Title Component
// ============================================

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          // Typography
          'font-semibold leading-none tracking-tight',
          // Size based on heading level (matching design system)
          Component === 'h1' && 'text-2xl',
          Component === 'h2' && 'text-xl',
          Component === 'h3' && 'text-lg',
          Component === 'h4' && 'text-base',
          Component === 'h5' && 'text-sm',
          Component === 'h6' && 'text-xs',
          // Color
          'text-[--text-primary]',
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

// ============================================
// Card Description Component
// ============================================

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        // Typography
        'text-sm',
        // Color (subtle content)
        'text-[--text-secondary]',
        className
      )}
      {...props}
    />
  );
});
CardDescription.displayName = 'CardDescription';

// ============================================
// Card Content Component
// ============================================

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Layout with configurable padding
          getPaddingStyles(padding),
          className
        )}
        {...props}
      />
    );
  }
);
CardContent.displayName = 'CardContent';

// ============================================
// Card Footer Component
// ============================================

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, align = 'end', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Layout
          'flex items-center',
          // Padding (slightly smaller than content)
          'p-4 pt-0',
          // Alignment
          getFooterAlignment(align),
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';

// ============================================
// Compound Component Pattern Export
// ============================================

/**
 * Export pattern for compound components
 * Usage: import { Card, CardHeader, CardContent } from '@/components/ui/card'
 */

// Alternative: Namespace export pattern (if preferred)
// export const CardNamespace = {
//   Root: Card,
//   Header: CardHeader,
//   Title: CardTitle,
//   Description: CardDescription,
//   Content: CardContent,
//   Footer: CardFooter,
// };

// ============================================
// Usage Examples (for development reference)
// ============================================

/**
 * EXAMPLE 1: Basic Project Card
 *
 * import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
 *
 * export function ProjectCard({ project }: { project: Project }) {
 *   return (
 *     <Card variant="raised">
 *       <CardHeader>
 *         <CardTitle as="h3">{project.name}</CardTitle>
 *         <CardDescription>{project.description}</CardDescription>
 *       </CardHeader>
 *       <CardContent>
 *         <div className="flex justify-between text-sm">
 *           <span className="text-[--text-secondary]">Status:</span>
 *           <span>{project.status}</span>
 *         </div>
 *       </CardContent>
 *       <CardFooter align="apart">
 *         <button className="text-sm text-[var(--content-secondary)]">Edit</button>
 *         <button className="text-sm text-[var(--brand-accent)]">View Details</button>
 *       </CardFooter>
 *     </Card>
 *   );
 * }
 */

/**
 * EXAMPLE 2: Settings Card with Glass Variant
 *
 * import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 *
 * export function SettingsCard() {
 *   return (
 *     <Card variant="glass" className="w-full max-w-md">
 *       <CardHeader divider>
 *         <CardTitle as="h2">System Settings</CardTitle>
 *       </CardHeader>
 *       <CardContent padding="lg">
 *         <form className="space-y-4">
 *           <label className="flex items-center justify-between">
 *             <span className="text-[var(--content-primary)]">Enable Notifications</span>
 *             <input type="checkbox" defaultChecked />
 *           </label>
 *           <button type="submit" className="w-full">
 *             Save Changes
 *           </button>
 *         </form>
 *       </CardContent>
 *     </Card>
 *   );
 * }
 */

/**
 * EXAMPLE 3: Minimal Card with Custom Styling
 *
 * import { Card, CardContent } from '@/components/ui/card';
 *
 * export function MetricCard({ value, label }: { value: string; label: string }) {
 *   return (
 *     <Card
 *       variant="surface"
 *       bordered={false}
 *       className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
 *     >
 *       <CardContent>
 *         <div className="text-2xl font-bold text-[var(--brand-primary)]">{value}</div>
 *         <div className="text-sm text-[var(--content-secondary)]">{label}</div>
 *       </CardContent>
 *     </Card>
 *   );
 * }
 */

// ============================================
// COMPONENT DEVELOPMENT CHECKLIST
// ============================================
//
// When creating new components, verify:
//
// [ ] Server Component by default (no "use client")
// [ ] Strict TypeScript types (no "any")
// [ ] Uses design system CSS variables (no hardcoded colors)
// [ ] Follows Linear design patterns
// [ ] Consistent prop naming and defaults
// [ ] Proper JSDoc documentation
// [ ] Compound component pattern where applicable
// [ ] Forward refs properly
// [ ] Has displayName for debugging
// [ ] Uses cn() utility for className composition
// [ ] Includes usage examples in comments
// [ ] Responsive by default
// [ ] Accessible (proper HTML semantics, ARIA where needed)
//
// ============================================
