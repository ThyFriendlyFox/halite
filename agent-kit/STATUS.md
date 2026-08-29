# STATUS.md — where the project actually stands

The single source of truth for project state. Claims require evidence: a
passing gate, a linked run, a tag. Updated in the same commit as the
behavior change. The weekly cycle (WEEKLY.md step 5) refreshes it.

| Area | State | Evidence |
|---|---|---|
| Core CLI (analyze/approve/emit/publish/rollback) | ✅ | `pnpm verify` |
| Browser runtime (IIFE + registerManifest) | ✅ | build emits `dist/halite.runtime.global.js` |
| Static analyzer adapter | ✅ | fixture tests in `tests/analyze.test.ts` |
| Live crawl adapter | ❌ | queued |
| Hosted SaaS / billing | 🧊 | explicitly not doing |
| npm publish under `halite` | 🚧 | package ready; registry publish needs maintainer token |

States: ✅ done (gated) · 🚧 in progress · ❌ not started · 🧊 frozen/won't do.

## Current week

- **Shipping:** between cycles (v0.1.0 core landed at kit install)
- **Last release:** v0.1.0 — 2026-08-29
- **Known red:** none
