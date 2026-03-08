## Component Classification Report

### BUCKET A — Direct shadcn replacement (0 components)
| Component | shadcn Equivalent | Call Sites | Confidence |
|---|---|---|---|

### BUCKET B — shadcn adapter required (0 components)
| Component | shadcn Equivalent | Adapter Reason | Call Sites | Confidence |
|---|---|---|---|---|

### BUCKET C — Keep logic, refactor internals (48 components)
| Component | Kept Because | Internal Elements to Replace | Confidence |
|---|---|---|---|
| src/app/(authenticated)/403/page.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/(authenticated)/admin/users/page.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/(authenticated)/layout.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/(authenticated)/page.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/(authenticated)/projects/[id]/client-page.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/(authenticated)/projects/[id]/commits/client-page.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/(authenticated)/projects/[id]/commits/loading.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/app/(authenticated)/projects/[id]/commits/page.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/(authenticated)/projects/[id]/layout.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/(authenticated)/projects/[id]/loading.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/app/(authenticated)/projects/[id]/page.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/(authenticated)/projects/[id]/project-layout-client.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/app/(authenticated)/projects/[id]/settings/loading.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/app/(authenticated)/projects/[id]/settings/page.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/(authenticated)/settings/page.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/auth/login/page.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/error.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/app/layout.tsx | Page/Layout structure | Basic HTML elements | High |
| src/app/not-found.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/action-bar.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/add-log-dialog.tsx | Complex state management in dialog | Dialog internals | Medium |
| src/components/agent-buttons.tsx | Complex composition | HTML elements | Low |
| src/components/agent-logs.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/agent-status-panel.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/archive-project-dialog.tsx | Complex state management in dialog | Dialog internals | Medium |
| src/components/bottom-tabs.tsx | Complex composition | HTML elements | Low |
| src/components/create-plan-dialog.tsx | Complex state management in dialog | Dialog internals | Medium |
| src/components/dashboard-project-list.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/features/projects/create-project-dialog.tsx | Complex state management in dialog | Dialog internals | Medium |
| src/components/generate-token-dialog.tsx | Complex state management in dialog | Dialog internals | Medium |
| src/components/inline-constitution-editor.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/inline-plan-editor.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/inline-spec-editor.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/inline-tech-stack-editor.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/layout/app-shell.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/layout/database-status.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/layout/project-sidebar-wrapper.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/layout/project-sidebar.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/layout/user-menu.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/log-test-result-dialog.tsx | Complex state management in dialog | Dialog internals | Medium |
| src/components/logo.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/project-card.tsx | Business logic / specialized props | Card structure, internal elements | High |
| src/components/project-tab-layout.tsx | Page/Layout structure | Basic HTML elements | High |
| src/components/specification-viewer.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/test-results-panel.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/theme-provider.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/theme-toggle.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |
| src/components/wave-manager.tsx | No primitive shadcn equivalent for primary purpose | Internal HTML elements | Medium |

### BUCKET D — Keep entirely (7 components)
| Component | Reason | Source |
|---|---|---|
| src/app/(authenticated)/projects/[id]/settings/client-page.tsx | > 150 lines of logic | Rule 0 |
| src/components/avatar.tsx | FORCE KEEP | Memory |
| src/components/create-task-dialog.tsx | > 150 lines of logic | Rule 0 |
| src/components/features/kanban/task-detail-modal.tsx | > 150 lines of logic | Rule 0 |
| src/components/kanban-board.tsx | FORCE KEEP | Memory |
| src/components/skeleton.tsx | FORCE KEEP | Memory |
| src/components/task-card.tsx | Drag-and-drop logic | Rule 0 |

### ESCALATE — Needs human decision (0 components)
| Component | Reason |
|---|---|

### Classification Assumptions
- All dialogs and complex cards (project-card, task-card) default to Bucket C due to their business logic, specialized props, and state management, meaning they can't be simple wrappers around `Dialog` or `Card` primitives without losing behavior.
- Pages and layouts are automatically Bucket C (internals refactored) to preserve routing and layout structure.
- 'kanban-board.tsx', 'skeleton.tsx', and 'avatar.tsx' are FORCE KEEP per memory constraints.
- Components with > 300 lines (e.g., inline editors, task-detail-modal) are assigned to D as they exceed the logic complexity threshold.
