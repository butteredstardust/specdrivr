# Security Policy

## Supported versions

Security fixes are applied to the latest release and the current `main` branch.
Older releases and unsupported forks may not receive fixes; upgrade to the most
recent supported version before reporting a problem that has already been
resolved.

## Reporting a vulnerability

Do not open a public issue or discussion. Email `security@specdrivr.dev` with:

- the affected version, component, and deployment topology;
- minimal reproduction steps or a proof of concept;
- the expected and observed behavior;
- the impact, prerequisites, and suggested severity;
- relevant logs with tokens, personal data, and secrets removed; and
- any suggested mitigation or disclosure deadline.

You should receive an acknowledgment within 2 business days. The maintainers
will validate and triage the report, share an estimated remediation timeline,
and coordinate disclosure. Please allow a reasonable remediation period before
publishing details. Reporters may request credit or anonymity.

## Scope

In scope are vulnerabilities in Specdrivr's application code, authentication
and authorization, server actions and routes, database access, tenant or project
isolation, secret handling, dependency configuration, and official deployment
artifacts.

Out of scope are denial-of-service tests against systems you do not own,
automated traffic that degrades a deployment, social engineering, exposed
credentials not caused by this project, and vulnerabilities that exist only in
unsupported local modifications. Third-party dependency vulnerabilities should
also be reported upstream, while notifying this project when its supported
versions are affected.

## Safe research

Use only accounts and data you control. Minimize access, modification, and
retention of personal data. Stop testing if you encounter another user's data,
and include no secrets in the report. Good-faith research consistent with this
policy will be handled constructively.
