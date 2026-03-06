# BUGS

1.  **Failing Test**: `Username field should be focused on load` in `tests/e2e/auth.spec.ts`
    *   **Observed Behavior**: The test expects the `#username` input to be focused when the `/auth/login` page is loaded. However, the element is `inactive` (not focused).
    *   **Suspected Location**: `src/app/auth/login/page.tsx`
    *   **Reasoning**: The `<input id="username" ...>` does not have the `autoFocus` property set. Standard business logic/UX expectations for a standalone login page usually dictate that the primary input field (username) should automatically receive focus to stream-line user entry.
