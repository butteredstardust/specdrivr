| File Name | Summary of Changes | Summary Reason for Change | Expected Impact | Best Practice Score | Reason for Deletion |
|---|---|---|---|---|---|
| `src/app/globals.css` | Mapped custom variables in `@theme` block | Fix Tailwind 4 resolution failures | Opaque backgrounds & consistent borders | 10/10 | not deleted |
| `src/app/not-found.tsx` | Added custom 404 page | Fix white screen on 404 routes | Theme consistency on errors | 10/10 | not deleted |
| `src/components/shell/top-bar.tsx` | Switched to `bg-[color:var(--bg-surface)]` | Restore mandated opaque styling | UI accessibility & design compliance | 10/10 | not deleted |
| `src/components/shell/sidebar.tsx` | Switched to `bg-[color:var(--bg-surface)]` | Restore mandated opaque styling | UI accessibility & design compliance | 10/10 | not deleted |
| `src/components/notifications/notification-panel.tsx` | Switched to opaque backgrounds | Fix popover transparency | UI readability | 10/10 | not deleted |
| `src/app/api/v1/sessions/route.ts` | Removed unused imports | Cleanup | Code quality | 10/10 | not deleted |

**Test Summary:**
- Verified opaque surfaces in Chrome on `/projects`.
- Custom 404 page verified.
- `pnpm lint` and `pnpm build` passing.
