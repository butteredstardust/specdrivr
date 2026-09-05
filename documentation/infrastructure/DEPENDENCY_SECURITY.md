# Dependency & Secret Security

Use this document to maintain the `Security` workflow (`.github/workflows/security.yml`). Follow its recovery procedure when a job fails.

The workflow runs on pushes to `main`, pull requests targeting `main`, every Monday at midnight UTC, and manual dispatch. The pull-request trigger blocks dependency and secret regressions before merge.

## Job: Dependency Audit

`pnpm audit --audit-level=high` fails on every high or critical advisory in the dependency tree.

### Why the tree is kept small

Keep `autoInstallPeers: false` in `pnpm-workspace.yaml`. `drizzle-orm` and `better-auth` declare optional database drivers and adapters. These include `prisma`, `mysql2`, `better-sqlite3`, `pglite`, and `@planetscale/database`. This project uses `pg` / `postgres`.

Do not install unused optional peers. They add audit findings without adding application behavior.

If you turn `autoInstallPeers` back on, expect this job to fail on
vulnerabilities in code the application does not load. Declare the peer you
actually need in `package.json` instead.

### When it fails

In order of preference:

1. **Update the package.** `pnpm update` resolves anything reachable within the
   existing semver ranges and is almost always enough. Widen the range in
   `package.json` if the fix is in a new major.
2. **Override a transitive dependency.** Add it to `overrides` in
   `pnpm-workspace.yaml` when a direct dependency has not yet released a bump
   for its own child.
3. **Record an exception.** Only when no fix is published. Add the GHSA id to
   `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml` with a comment naming the
   package, why the risk is acceptable here, and when to recheck. Remove it once
   upstream patches.

Do not lower `--audit-level`. It converts a specific, reviewable exception into
a silent blanket one.

Do not use either of these configurations:

- **`pnpm` settings in `package.json` are ignored.** pnpm 10 reads `overrides`,
  `auditConfig` and friends from `pnpm-workspace.yaml`. A `"pnpm"` block in
  `package.json` is silently dropped with only a `[WARN]` line.
- **`overrides` do not reach auto-installed peer dependencies.** `vite` arrives
  as a peer of `@vitejs/plugin-react` and `vitest`; an override for it has no
  effect. It is declared directly in `devDependencies` for exactly this reason.
  Keep `vite` in `devDependencies` when the project requires it.

### Keeping it green

`.github/dependabot.yml` opens grouped weekly pull requests for npm packages and GitHub Actions. Review these updates to prevent dependency drift and recurring audit failures.

## Job: Secret Scan

TruffleHog, pinned to both an action SHA and a scanner image version so a new
detector release cannot turn `main` red without a commit. Bump the two together.

It diffs base against head on pull requests, scans the pushed range on push, and
rescans **all of git history** on scheduled and manual runs.

### When it fails

Check `Verified` first. A verified finding is a live credential: rotate it
immediately, then purge it. Rotation comes first - the secret is compromised
from the moment it is pushed, and removing it from the repository does not
un-leak it.

Unverified findings are usually placeholders or local-only values, but confirm
that individually rather than assuming.

### Exclusions

Known-safe paths live in `.github/trufflehog-exclude.txt`. Add one RE2 regex per line. Each regex matches a repository-relative path. The list covers local Docker Compose files and two agent instruction documents with placeholder or localhost-only database credentials.

Because scheduled scans cover full history, **editing or removing a file does not clear its finding**. The old blob remains reachable. Use a path exclusion or rewrite history.

Weigh that before adding an entry: an excluded path is a blind spot for all of
history, including commits not yet written. Fix the file if you can. Also do not
paste example connection strings into the exclude file itself - TruffleHog scans
it like any other file, and a credential-shaped comment there becomes a
permanent self-inflicted finding.

## Reproducing locally

```bash
pnpm audit --audit-level=high

docker run --rm -v "$PWD:/tmp" -w /tmp ghcr.io/trufflesecurity/trufflehog:3.97.4 \
  git file:///tmp/ --fail --no-update \
  --exclude-paths=.github/trufflehog-exclude.txt
```

Note the image tag has no `v` prefix, unlike the action tag.
