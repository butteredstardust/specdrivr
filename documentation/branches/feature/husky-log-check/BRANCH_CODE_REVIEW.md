# Senior Review: Block .log files in pre-push hook

This change adds a check to the `pre-push` hook to ensure that no `.log` files are committed. While `.log` files are already in `.gitignore`, this hook provides an additional safeguard against forced additions (`git add -f`) or gitignore misconfigurations.

## Improvements & Considerations
- The check uses `git diff --cached --name-only` which correctly identifies files staged for commitment.
- The use of `grep -q "\.log$"` ensures only files ending in `.log` are targeted.
- This aligns with project standards for keeping the repository clean of non-source artifacts.

The implementation is correct and follows established patterns in the existing hook.
