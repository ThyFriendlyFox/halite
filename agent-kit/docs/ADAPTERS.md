# Adapters

An analyzer adapter turns a site or repository into draft `HaliteTool`s.
Halite ships 2 analyzers. The CLI picks one with `--url` (live) or a local
path (static).

## static

Default for local paths. Walks files with heuristics. Does not run project
code. Also invents SPA controls from buttons, selects, file inputs, and
radio groups in HTML.

```json
{ "analyzer": { "id": "static" } }
```

## crawl (live URL)

Used by `halite analyze --url <https>`. Renders the page in Chrome via
`playwright-core`, optionally probes the first file input with a tiny PNG
(`--no-probe` to disable), then invents tools from the live DOM.

```bash
halite analyze --url https://www.nano-banner.com/ -o halite.tools.json
```

## Writing a new adapter

1. Implement `AnalyzerAdapter` in `src/adapters/` (`id` + `analyze`).
2. Register it with `registerAnalyzer`.
3. Add a row to this file and any new knobs to `CONFIGURATION.md`.
4. Add a gate under `tests/` and keep `pnpm verify` green.
