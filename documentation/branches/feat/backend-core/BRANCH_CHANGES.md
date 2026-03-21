# Branch Changes: feat/backend-core

| File Name | Summary of Changes | Summary Reason for Change | Expected Impact | Best Practice Evaluation Score | Reason for Deletion |
| --- | --- | --- | --- | --- | --- |
| [globals.css](file:///Users/tuxgeek/Dev/specdrivr/src/app/globals.css) | Refined `--terminal-bg` and `--terminal-text` for Light Mode. | Fixed color clash in Light Mode where terminal was black. | Consistent Light Mode UI. | 10/10 | Not deleted |
| [live-terminal.tsx](file:///Users/tuxgeek/Dev/specdrivr/src/components/ui/live-terminal.tsx) | Updated fallback background to `transparent`. | Prevent hardcoded dark backgrounds during initialization. | Seamless theme transitions. | 9/10 | Not deleted |
| [README.md](file:///Users/tuxgeek/Dev/specdrivr/README.md) | References to screenshots remain same, but assets updated. | Visual documentation parity with new UI. | Professional documentation. | 10/10 | Not deleted |
| [public/screenshots/*.png](file:///Users/tuxgeek/Dev/specdrivr/public/screenshots/) | Replaced 14 legacy screenshots with 9 fresh Light Mode captures. | Documentation update as requested by user. | Accurate visual guides. | 10/10 | 14 files replaced with 9 |

## CI & Testing
- Updated the production build to pick up tailwind v4 changes.
- Verified system integrity with `pnpm lint` and `pnpm test:unit`.
