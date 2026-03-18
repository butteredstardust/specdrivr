---
name: responsive-design-checker
description: Test components across all breakpoints to ensure responsive design works correctly
type: subagent
user-invocable: true
---

# Responsive Design Checker Agent

**Purpose:** Verify components work correctly across mobile, tablet, and desktop breakpoints.

**Invocation:** Before mobile release or quarterly

**Speed:** ~3-5 min per component set

## How to Use

```bash
# Full responsive audit
claude agent responsive-design-checker "Test all components at mobile, tablet, desktop"

# Specific component
claude agent responsive-design-checker "Test src/components/projects/project-grid.tsx on all breakpoints"

# Component directory
claude agent responsive-design-checker "Check src/components/shell/ for responsive issues"

# Specific breakpoint
claude agent responsive-design-checker "Test all components on mobile (320px)"
```

## What It Tests

### Breakpoints

- **Mobile (320px)** — iPhone SE, small phones
- **Tablet (768px)** — iPad, tablets
- **Desktop (1024px)** — Laptop, standard desktop
- **Wide (1280px)** — Large desktop, 4K monitors

### Checks Per Breakpoint

1. **Layout integrity** — No overlapping elements
2. **Text readability** — No truncation, readable font size
3. **Touch targets** — Minimum 44×44px for mobile
4. **Overflow** — No horizontal scrolling
5. **Navigation** — Menu accessible on mobile
6. **Images** — Proper scaling, no distortion
7. **Forms** — Inputs large enough, labels visible
8. **Spacing** — Proper padding/margins

## Example Report

```
RESPONSIVE DESIGN AUDIT

Components tested: 33
Breakpoints: 4 (320px, 768px, 1024px, 1280px)
Total tests: 132

Mobile (320px):
✓ PASS: 28 components
⚠️ WARN: 4 components (minor issues)
❌ FAIL: 1 component

🔴 CRITICAL FAILURES (1):

1. src/components/projects/project-grid.tsx
   Breakpoint: Mobile (320px)
   Issues:

   a) Grid collapses into single column (expected)
      But: Cards have fixed width 300px > viewport (320px - padding)
      Problem: Cards overflow right, causes horizontal scroll
      Expected: Cards responsive with max-width 100%

      HTML:
        <div className="grid grid-cols-1 gap-4">
          <ProjectCard className="w-[300px]" /> ← Fixed 300px width!
        </div>

      Fix:
        <div className="grid grid-cols-1 gap-4">
          <ProjectCard className="w-full max-w-[300px]" />
        </div>

   b) Card content padding: 32px (too much for 320px)
      Available space: 320px - 32px padding - 32px padding = 256px
      Content width needed: 280px
      Problem: Content overflow inside card

      Fix: Reduce padding on mobile
        <div className="p-4 md:p-6 lg:p-8" />

   Severity: 🔴 CRITICAL (breaks layout)

2. src/components/shell/sidebar.tsx
   Breakpoint: Mobile (320px)
   Issue: Sidebar hidden but hamburger menu missing
   Expected: Drawer pattern or hamburger
   Actual: Content shifts when sidebar hidden

   Fix: Add mobile hamburger menu
     <Burger className="md:hidden" onClick={() => setOpen(!open)} />

⚠️ WARNINGS (4):

1. src/components/dashboard/event-log.tsx - Mobile (320px)
   Issue: Table component doesn't stack on mobile
   Expected: Stack rows vertically, show "key: value" format
   Impact: Minor (users can scroll table horizontally if needed)

   Recommendation: Add mobile-optimized card layout
     className="hidden md:table" (hide table on mobile)
     className="md:hidden" (show card layout on mobile)

2. src/components/ui/button.tsx
   Issue: Button text too long, wraps awkwardly
   Example: "Create New Project" becomes "Create\nNew\nProject"
   Impact: Looks bad but functional

   Recommendation: Truncate text on mobile
     <span className="hidden sm:inline">Create New</span>
     <span className="sm:hidden">+</span>

3. src/components/projects/create-project-form.tsx - Tablet (768px)
   Issue: Input fields don't expand full width
   Expected: Full width on small screens
   Actual: Fixed max-width causes narrower inputs

   Fix:
     <input className="w-full max-w-none sm:max-w-md" />

4. src/components/shell/top-bar.tsx - Mobile (320px)
   Issue: Icons too close together (28px spacing)
   Minimum touch target: 44×44px
   Current spacing: 28px
   Impact: Hard to tap individual buttons

   Fix:
     <div className="flex gap-2 md:gap-4" />
     // On mobile: gap-2 = 8px (with 18px icon = hard to tap)
     // Fix: gap-3 or wrap icon in 44×44 box

✓ PASS (28 components):
  ✓ src/components/ui/card.tsx - All breakpoints
  ✓ src/components/ui/button.tsx - All breakpoints (after fix)
  ✓ src/components/ui/input.tsx - All breakpoints
  ✓ src/components/dashboard/needs-attention-banner.tsx - All breakpoints
  ... (25 more)

📊 RESPONSIVE SCORE:

Breakpoint coverage:
  Mobile (320px):   79% pass (28/33)
  Tablet (768px):   91% pass (30/33)
  Desktop (1024px): 100% pass (33/33)
  Wide (1280px):    100% pass (33/33)

Issues by type:
  Layout overflow:     2
  Fixed width issues:  2
  Text wrapping:       1
  Touch targets:       1
  Navigation:          0
  Images:              0
  Forms:               1
  Spacing:             0

Touch target compliance (mobile):
  44×44px minimum:     30/33 components ✓
  Below 44×44px:       3 components (buttons in top-bar, etc.)

Font size compliance (mobile):
  16px minimum:        33/33 components ✓
  Below 16px:          0 components ✓

🎯 PRIORITY FIXES:

Critical (Fix before release):
  1. project-grid.tsx - Fixed widths causing overflow
  2. sidebar.tsx - Missing mobile menu

High (Fix this sprint):
  3. event-log.tsx - Mobile table layout
  4. top-bar.tsx - Touch target spacing
  5. create-project-form.tsx - Input field widths

Medium (Next sprint):
  6. button.tsx - Text wrapping
  7. Documentation - Responsive patterns

ESTIMATED FIX TIME: 2-3 hours
MOBILE READINESS: 70% (will improve to 95%+ after fixes)

Next steps:
  1. Fix critical issues (30 min)
  2. Test on real devices (15 min)
  3. Fix high-priority items (90 min)
  4. Rerun responsive-checker (5 min)
  5. Deploy with confidence
```

## Responsive Patterns

### Tailwind Responsive Classes

```typescript
// ✓ CORRECT responsive pattern
<div className="w-full px-4 md:px-6 lg:px-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <Card className="p-4 md:p-6" />
  </div>
</div>

// Key points:
// - w-full (use available width)
// - px-4 md:px-6 (reduce padding on small screens)
// - grid-cols-1 md:grid-cols-2 (stack on mobile)
// - p-4 md:p-6 (reduce card padding on mobile)
```

### Mobile-First Approach

```typescript
// ✓ MOBILE-FIRST (better practice)
<div className="text-sm md:text-base lg:text-lg">
  // Starts small on mobile, grows on larger screens

// ❌ DESKTOP-FIRST (avoid)
<div className="text-lg sm:text-base xs:text-sm">
  // Confusing and harder to maintain
```

### Touch Targets

```typescript
// ✓ 44×44px minimum
<button className="w-11 h-11 md:w-10 h-10">
  <Icon size={24} />
</button>

// ❌ Too small on mobile
<button className="w-8 h-8">
  <Icon size={24} />
</button>
```

### Flexible Widths

```typescript
// ✓ RESPONSIVE
<input className="w-full max-w-md" />

// ❌ FIXED
<input className="w-96" /> {/* Always 384px */}

// Explanation:
// w-full = use 100% of parent width
// max-w-md = but cap at 28rem (448px) on large screens
// Result: Fills small screens, constrained on large screens
```

## Integration

### Pre-Mobile Release Checklist

```markdown
## Responsive Design

- [ ] Run responsive-design-checker on all components
- [ ] All critical issues fixed
- [ ] Test on iOS Safari (different rendering)
- [ ] Test on Android Chrome
- [ ] No horizontal scrolling on mobile
- [ ] Touch targets ≥ 44×44px
- [ ] Font sizes ≥ 16px on mobile
```

### CI/CD Integration

```yaml
# .github/workflows/responsive.yml
- name: Responsive Design Check
  run: |
    claude agent responsive-design-checker "Test all components"
```

### Regular Testing

Monthly:

```bash
claude agent responsive-design-checker "Monthly responsive audit"
```

## Testing Tools

- **Playwright MCP** — Automated testing at breakpoints
- **Chrome DevTools** — Manual testing (F12 → Toggle device toolbar)
- **Real devices** — iPhone, iPad, Android phones

## Related Commands

- `src/app/globals.css` — Design tokens, breakpoints
- `DESIGN_SYSTEM.md` — Layout guidelines
- `Tailwind CSS` — Responsive utilities
- Playwright MCP — Browser testing

---

**Mobile isn't optional. Every component must work on every device.**
