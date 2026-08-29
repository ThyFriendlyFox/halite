# Adapters

An analyzer adapter turns a site or repository into draft `HaliteTool`s.
Halite ships 1 adapter. Select one with the analyzer id (CLI will grow
`--adapter <id>`; library callers use `getAnalyzer(id)`).

## static

Default. Walks local files with heuristics. Does not run project code.
Use this for Sodium-like "connect a repository" flows on your laptop or CI.

```json
{ "analyzer": { "id": "static" } }
```

## Writing a new adapter

1. Implement `AnalyzerAdapter` in `src/adapters/` (`id` + `analyze`).
2. Register it with `registerAnalyzer`.
3. Add a row to this file and any new knobs to `CONFIGURATION.md`.
4. Add a gate under `tests/` and keep `pnpm verify` green.
