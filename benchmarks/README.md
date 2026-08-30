# Live bench

Halite's unit gate (`pnpm verify`) stays offline and deterministic.
Live pages belong in a **separate** job so a broken third-party site
does not block ordinary PRs.

## Catalog

`benchmarks/live-sites.json` lists public URLs with:

| Field | Role |
|---|---|
| `tier` | `core` fails the job; `soft` is advisory |
| `kind` | spa-controls, html-form, ecommerce, webmcp-demo, docs, negative |
| `minTools` / `maxTools` | count bounds after analyze |
| `expectNameContains` | soft name hints (pass if ≥ half match) |
| `probe` | upload a tiny PNG into the first file input |

## Local

```bash
pnpm build
pnpm live-bench                 # all sites
HALITE_LIVE_TIER=core pnpm live-bench
HALITE_LIVE_ONLY=nano-banner,httpbin-forms-post pnpm live-bench
```

Outputs land in `benchmarks/out/` (gitignored): per-site manifests + `summary.json`.

## GitHub Actions

Template: `agent-kit/workflows/live-bench.yml`.

Copy to `.github/workflows/live-bench.yml` when the pusher has the
`workflow` scope. Triggers: nightly cron, `workflow_dispatch`, and PRs
labeled `live-bench`.

Main `ci.yml` does **not** call live-bench.
