---
name: tailwind-css-variables-auditor
description: Audit Tailwind CSS and CSS variables for design token consistency
type: subagent
user-invocable: true
---

# Tailwind + CSS Variables Auditor Agent

**Purpose:** Ensure Tailwind and CSS variables maintain consistent design tokens across codebase.

**Invocation:** Code review or design system updates

**Speed:** ~1.5 min

## How to Use

```bash
claude agent tailwind-css-variables-auditor "Audit CSS variables and Tailwind usage"
claude agent tailwind-css-variables-auditor "Check design token consistency"
```

## What It Checks

### 1. CSS Variables Definition

```css
/* ✓ CORRECT - Organized CSS variables */
:root {
  /* Colors */
  --color-primary: #6366f1;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Semantic colors */
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --border-color: #e5e7eb;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* ❌ WRONG - Hardcoded colors */
.button {
  background-color: #6366f1;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
}
```

### 2. Tailwind Config Integration

```javascript
// ✓ CORRECT - CSS variables in Tailwind config
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
        },
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
      },
      fontSize: {
        sm: ['var(--font-size-sm)', 'var(--line-height-tight)'],
        base: ['var(--font-size-base)', 'var(--line-height-normal)'],
        lg: ['var(--font-size-lg)', 'var(--line-height-normal)'],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
    },
  },
};

// ❌ WRONG - Hardcoded colors in Tailwind
export default {
  theme: {
    extend: {
      colors: {
        blue: '#3b82f6',
        red: '#ef4444',
        // ...
      },
    },
  },
};
```

### 3. Component Class Usage

```typescript
// ✓ CORRECT - Use CSS variable classes
export function Button({ children, variant = 'primary' }: ButtonProps) {
  return (
    <button className={cn(
      'px-4 py-2 rounded-md font-medium transition-colors',
      'bg-[var(--color-primary)] text-white hover:opacity-90',
      variant === 'secondary' && 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
    )}>
      {children}
    </button>
  );
}

// ❌ WRONG - Hardcoded Tailwind colors
export function Button({ children }) {
  return (
    <button className="px-4 py-2 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700">
      {children}
    </button>
  );
}
```

### 4. Dark Mode with CSS Variables

```css
/* ✓ CORRECT - CSS variables for light/dark modes */
:root {
  --text-primary: #1f2937;
  --bg-primary: #ffffff;
  --border-color: #e5e7eb;
}

@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #f3f4f6;
    --bg-primary: #111827;
    --border-color: #374151;
  }
}

/* ❌ WRONG - Manual light/dark styles */
.card {
  background: white;
  color: #1f2937;
}

.dark .card {
  background: #111827;
  color: #f3f4f6;
}
```

### 5. Spacing System Consistency

```typescript
// ✓ CORRECT - Use spacing scale consistently
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-[var(--spacing-md)] rounded-lg border border-[var(--border-color)]">
      <div className="space-y-[var(--spacing-sm)]">
        {children}
      </div>
    </div>
  );
}

// ❌ WRONG - Random spacing values
export function Card({ children }) {
  return (
    <div className="p-5 rounded-lg border">
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}
```

### 6. Design Token Documentation

```typescript
// ✓ CORRECT - Document design tokens
/**
 * Design Tokens - CSS Variables
 *
 * Color System:
 * - Primary: for main actions and highlights
 * - Success: for positive feedback
 * - Warning: for cautions
 * - Error: for errors
 *
 * Text Colors:
 * - text-primary: main body text
 * - text-secondary: secondary information
 * - text-muted: disabled or lower priority
 *
 * Usage:
 * className="text-[var(--text-primary)] bg-[var(--bg-primary)]"
 */

export const DESIGN_TOKENS = {
  colors: {
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    text: {
      primary: 'var(--text-primary)',
      secondary: 'var(--text-secondary)',
    },
  },
  spacing: {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
  },
} as const;
```

### 7. Avoiding Design Token Bypass

```typescript
// ✓ CORRECT - Always use design tokens
const className = cn(
  'rounded-md p-4',
  'bg-[var(--color-primary)] text-white'
);

// ❌ WRONG - Mixing token and non-token values
const className = 'p-4 bg-blue-500 text-white';

// ❌ WRONG - Inline styles instead of tokens
<div style={{ backgroundColor: '#6366f1', padding: '1rem' }}>
```

## Report Includes

- Hardcoded colors instead of CSS variables
- Tailwind colors not using CSS variables
- Missing CSS variable definitions
- Inconsistent spacing (not using spacing scale)
- Missing dark mode CSS variables
- Inconsistent font sizes
- Unused design tokens
- Design tokens not in Tailwind config
- Missing design token documentation
- Light/dark mode inconsistencies

## Integration

Create `src/styles/tokens.css`:

```css
@layer base {
  :root {
    /* Colors */
    --color-primary: #6366f1;
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #ef4444;

    /* Semantic */
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --bg-primary: #ffffff;
    --bg-secondary: #f9fafb;
    --border-color: #e5e7eb;

    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --text-primary: #f3f4f6;
      --text-secondary: #d1d5db;
      --bg-primary: #111827;
      --bg-secondary: #1f2937;
      --border-color: #374151;
    }
  }
}
```

Add to components:

```typescript
import { cn } from '@/lib/utils';

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      'rounded-lg border',
      'bg-[var(--bg-primary)] text-[var(--text-primary)]',
      'border-[var(--border-color)]',
      'p-[var(--spacing-md)]'
    )}>
      {children}
    </div>
  );
}
```

## Design System Checklist

- **CSS Variables**: All tokens defined in `:root`
- **Tailwind Integration**: Config extends with CSS variables
- **Dark Mode**: Variables overridden in dark mode media query
- **Consistency**: All colors use tokens, not hardcoded
- **Spacing**: Scale consistent (xs, sm, md, lg, xl)
- **Documentation**: Token definitions documented
- **Naming**: Semantic names (text-primary, not text-dark)
- **Coverage**: All UI properties use tokens

---

**Design tokens ensure consistency. Keep them organized.**
