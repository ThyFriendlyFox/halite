# ROADMAP.md — the source of all work

**This file is not optional.** Every feature the agent builds flows down
from here. If it isn't on this roadmap, it doesn't get built; if it needs
building, it gets added here first. One item ships per weekly cycle
(see `WEEKLY.md`).

## North star

Halite is the free open-source way to turn an existing website into
WebMCP tools: analyze locally, approve explicitly, publish one script
tag, version and roll back without a SaaS bill.

## Feature Queue — ordered; top unblocked item ships next

provisional: true

### 1. Live URL crawl adapter
- **Promise:** `halite analyze --adapter crawl --url <https>` proposes tools from a public page DOM without reading local source.
- **Evidence:** integration test with a local static server fixture; adapter listed in `docs/ADAPTERS.md`.
- **Use case:** Crawl a live page
- **Scope guard:** No authenticated crawling; no executing page JS beyond Playwright DOM content.
- **Status:** ready

### 2. Next.js script injection helper
- **Promise:** `halite init next` prints a drop-in snippet for `app/layout.tsx` that loads the published runtime.
- **Evidence:** unit test of the emitted snippet string; README documents the command.
- **Use case:** Publish forms on a marketing site
- **Scope guard:** Does not modify the user's Next.js project files automatically.
- **Status:** ready

### 3. Self-hosted call counter
- **Promise:** Optional runtime beacon posts tool-call events to a same-origin `/halite/events` endpoint stub with documented request shape.
- **Evidence:** test that the beacon payload matches the documented schema; default remains off.
- **Use case:** CI re-scan on push
- **Scope guard:** No hosted analytics SaaS; no third-party beacons.
- **Status:** ready

## Later — candidates, not yet specced

- Optional LLM enrichment adapter (user-supplied API key) for better descriptions.
- GitHub Action that re-analyzes on push and opens a PR with draft tools.
- Answer-engine referrer dashboard (self-hosted).

## Shipped

| Week | Feature | Release | Evidence |
|---|---|---|---|
| 2026-08-29 | Declarative HTML annotate command | v0.2.0 | `tests/schema-annotate.test.ts`; `halite annotate` |
| 2026-08-29 | Manifest editor JSON Schema export | v0.2.0 | `halite schema`; `schemas/halite.manifest.schema.json` |
| 2026-08-29 | Core analyze / approve / publish / runtime | v0.1.0 | `pnpm verify`; fixture finds contact, cart, search tools |

## Explicitly not doing

- Hosted paid multi-tenant control plane — out of scope for this MIT core.
- Automatic publish without approval — violates approved-only invariant.
- Replacing backend MCP servers — WebMCP is in-page only.

## Queue changes

- 2026-08-29 — seeded provisional queue at install (SETUP).
- 2026-08-29 — shipped annotate + schema; refilled queue with next/init and beacon.
