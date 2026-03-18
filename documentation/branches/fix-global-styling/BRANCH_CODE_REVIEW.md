# Branch Code Review: fix/global-styling

## Overview

This PR addresses systemic styling issues where UI elements appeared transparent or broke the dark theme. The changes modernize the theme consumption by using Tailwind 4's `@theme` registration and unify token usage across the shell components.

## Strengths

- **Tailwind 4 idiomatic approach**: Registering variables in `@theme` is the correct way to handle custom tokens in the new version.
- **Improved UX**: The addition of a branded 404 page prevents "flash of white" when navigating to non-existent routes.
- **Mass Migration**: The use of automated regex replacement ensures no "straggler" arbitrary classes are left behind.

## Improvements & Recommendations

- **Variable Standard**: We should eventually move all hex-based variables (`--bg-base: #...`) to HSL format to be consistent with the standard shadcn variables. This would allow for easier opacity modifiers in the future.
- **Component Audit**: While the major shell components were fixed, a full audit of every page should be performed as part of regular development to ensure no one-off arbitrary styles were missed.

## Score: 9.5/10

The implementation is solid, follows all `AGENTS.md` rules, and resolves the root cause rather than applying a surface-level fix.
