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

### 1. Declarative HTML annotate command
- **Promise:** `halite annotate <file>` writes `toolname` / `tooldescription` onto detected forms and prints a diff summary.
- **Evidence:** unit test on `tests/fixtures/html-site/index.html` plus `pnpm verify` green.
- **Use case:** Annotate forms
- **Scope guard:** Does not invent React component props; HTML only in this item.
- **Status:** ready

### 2. Live URL crawl adapter
- **Promise:** `halite analyze --adapter crawl --url <https>` proposes tools from a public page DOM without reading local source.
- **Evidence:** integration test with a local static server fixture; adapter listed in `docs/ADAPTERS.md`.
- **Use case:** Crawl a live page
- **Scope guard:** No authenticated crawling; no executing page JS beyond Playwright DOM content.
- **Status:** ready

### 3. Manifest editor JSON Schema export
- **Promise:** `halite schema` prints the Halite manifest JSON Schema to stdout for editor validation.
- **Evidence:** snapshot test of schema `$id` and required fields; `pnpm verify` green.
- **Use case:** Hand-author tools
- **Scope guard:** Does not build a GUI editor.
- **Status:** ready

## Later — candidates, not yet specced

- Optional LLM enrichment adapter (user-supplied API key) for better descriptions.
- Next.js plugin that injects the script tag in `layout.tsx`.
- Agent analytics (self-hosted counters) as an optional package.
- GitHub Action that re-analyzes on push and opens a PR with draft tools.

## Shipped

| Week | Feature | Release | Evidence |
|---|---|---|---|
| 2026-08-29 | Core analyze / approve / publish / runtime | v0.1.0 | `pnpm verify`; fixture finds contact, cart, search tools |

## Explicitly not doing

- Hosted paid multi-tenant control plane — out of scope for this MIT core.
- Automatic publish without approval — violates approved-only invariant.
- Replacing backend MCP servers — WebMCP is in-page only.

## Queue changes

- 2026-08-29 — seeded provisional queue at install (SETUP).
