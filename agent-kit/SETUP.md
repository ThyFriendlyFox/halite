# SETUP.md — one-time installation into a repo

Run this once, when this kit lands in a repo and unset template tokens
still exist. When finished, no unset template tokens remain in `agent-kit/`.

**Status: complete for Halite (2026-08-29).** Template tokens are filled.
Re-run only when forking into a different project.

## Recorded values

| Placeholder | Value |
|---|---|
| PROJECT_NAME | Halite |
| REPO_SLUG | halite-dev/halite |
| DEFAULT_BRANCH | main |
| BUILD_CMD | pnpm build |
| TEST_CMD | pnpm test |
| LINT_CMD | pnpm lint |
| VERIFY_CMD | pnpm verify |
| MIN_RUNTIME | Node.js 20+ |
| SECURITY_EMAIL | GitHub Security Advisories (no public email yet) |
| PKG_ECOSYSTEM | npm |
