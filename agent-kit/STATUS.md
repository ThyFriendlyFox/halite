# STATUS.md — where the project actually stands

The single source of truth for project state. Claims require evidence: a
passing gate, a linked run, a tag. Updated in the same commit as the
behavior change. The weekly cycle (WEEKLY.md step 5) refreshes it.

| Area | State | Evidence |
|---|---|---|
| Core CLI (analyze/approve/emit/publish/rollback) | ✅ | `pnpm verify` |
| Live URL analyze (`--url`) | ✅ | nano-banner.com → 7 tools |
| SPA control scanner | ✅ | `tests/spa-controls.test.ts` |
| `halite annotate` / `halite schema` | ✅ | `tests/schema-annotate.test.ts` |
| Browser runtime (set/upload/click/form) | ✅ | build + prior browser E2E |
| Hosted SaaS / billing | 🧊 | explicitly not doing |
| npm publish under `halite` | 🚧 | package ready; registry publish needs maintainer token |

States: ✅ done (gated) · 🚧 in progress · ❌ not started · 🧊 frozen/won't do.

## Current week

- **Shipping:** between cycles (v0.3.0 live URL + SPA DOM)
- **Last release:** v0.3.0 — 2026-08-30
- **Known red:** none
