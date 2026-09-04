# Dependency & Secret Security

How the `Security` workflow (`.github/workflows/security.yml`) works, and what
to do when it goes red.

It runs on push to `main`, on pull requests targeting `main`, every Monday at
midnight UTC, and on manual dispatch. The PR trigger is the important one: it
means a dependency or secret regression blocks before merge rather than
surfacing later on a scheduled run nobody is watching.

## Job: Dependency Audit

`pnpm audit --audit-level=high` - fails on any high or critical advisory
anywhere in the dependency tree.

### Why the tree is kept small

`autoInstallPeers: false` in `pnpm-workspace.yaml` is load-bearing. `drizzle-orm`
and `better-auth` declare every database driver and adapter they support as
optional peer dependencies - `prisma`, `mysql2`, `better-sqlite3`, `pglite`,
`@planetscale/database` and roughly a dozen more. With auto-install on, pnpm
installed all of them even though this project only uses `pg` / `postgres`.

That dead subtree, which is never imported and never ships, produced the large
majority of audit findings. Turning it off took the tree from 65 high and 2
critical advisories to zero.

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

Two things that will not work, both of which have already cost time here:

- **`pnpm` settings in `package.json` are ignored.** pnpm 10 reads `overrides`,
  `auditConfig` and friends from `pnpm-workspace.yaml`. A `"pnpm"` block in
  `package.json` is silently dropped with only a `[WARN]` line.
- **`overrides` do not reach auto-installed peer dependencies.** `vite` arrives
  as a peer of `@vitejs/plugin-react` and `vitest`; an override for it has no
  effect. It is declared directly in `devDependencies` for exactly this reason.
  A stale `vite: ^7.3.1` override previously pinned the tree *to* the vulnerable
  version it was meant to fix.

### Keeping it green

`.github/dependabot.yml` opens grouped weekly PRs for npm packages and GitHub
Actions. This is what makes the audit gate sustainable - without it the lockfile
drifts until a routine advisory turns the workflow permanently red, at which
point the failure stops being read as signal. That is precisely how this job
came to fail every week for months.

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

Known-safe paths live in `.github/trufflehog-exclude.txt` - one RE2 regex per
line, matched against the repository-relative path. Currently: the local
Docker Compose files and the two agent instruction docs, all of which carry
placeholder or localhost-only database credentials.

Because the scheduled run covers full history, **editing or deleting a file does
not clear its finding** - the old blob is still reachable from old commits. Path
exclusion is the only practical remedy short of rewriting history, which is why
the exclude list also names paths these files used to live at.

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
