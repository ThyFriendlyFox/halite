# ROADMAP.md — the source of all work

**This file is not optional.** Every feature the agent builds flows down
from here. If it isn't on this roadmap, it doesn't get built; if it needs
building, it gets added here first. One item ships per weekly cycle
(see `WEEKLY.md`).

## North star

Halite is the free open-source way to turn an existing website into
WebMCP tools: analyze locally or from a live URL, approve explicitly,
publish one script tag, version and roll back without a SaaS bill.

## Feature Queue — ordered; top unblocked item ships next

### 1. Next.js script injection helper
- **Promise:** `halite init next` prints a drop-in snippet for `app/layout.tsx` that loads the published runtime.
- **Evidence:** unit test of the emitted snippet string; README documents the command.
- **Use case:** Publish forms on a marketing site
- **Scope guard:** Does not modify the user's Next.js project files automatically.
- **Status:** ready

### 2. Self-hosted call counter
- **Promise:** Optional runtime beacon posts tool-call events to a same-origin `/halite/events` endpoint stub with documented request shape.
- **Evidence:** test that the beacon payload matches the documented schema; default remains off.
- **Use case:** CI re-scan on push
- **Scope guard:** No hosted analytics SaaS; no third-party beacons.
- **Status:** ready

### 3. Multi-page crawl depth
- **Promise:** `halite analyze --url <https> --depth 2` follows same-origin links and merges tools across pages.
- **Evidence:** local static-server fixture with 2 linked pages; merged manifest contains tools from both.
- **Use case:** Crawl a live page
- **Scope guard:** Depth capped at 3; no authenticated crawling.
- **Status:** ready

## Later — candidates, not yet specced

- Optional LLM enrichment adapter (user-supplied API key) for better descriptions.
- GitHub Action that re-analyzes on push and opens a PR with draft tools.
- Answer-engine referrer dashboard (self-hosted).
- Multi-page crawl depth > 1 with sitemap discovery.

## Shipped

| Week | Feature | Release | Evidence |
|---|---|---|---|
| 2026-08-30 | SPA DOM + live URL analyze (nano-banner proof) | v0.3.0 | `halite analyze --url https://www.nano-banner.com/` → 7 tools; spa-controls tests |
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
- 2026-08-30 — promoted live URL + SPA DOM to #1 after nano-banner.com returned 0 tools; merged former crawl-adapter item into this promise.
- 2026-08-30 — shipped SPA DOM + live URL as v0.3.0; nano-banner.com produced 7 tools.
