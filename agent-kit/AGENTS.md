# AGENTS.md — the binding contract

In effect whenever code in this repo is touched, by agent or human.
When this conflicts with intuition, this wins.

## Commands

```sh
pnpm build      # build
pnpm test       # tests
pnpm lint       # lint / format check
pnpm verify     # full health gate — must pass before any push
```

Requires Node.js 20+.

## Invariants — never regress these

1. **Static analysis only by default.** The `static` analyzer must not execute repository code, spawn the app, or push git changes.
2. **Approved-only registration.** The browser runtime registers `status: "approved"` tools unless the caller sets `approvedOnly: false`.
3. **Manifest schemaVersion stays compatible.** Breaking manifest changes bump `schemaVersion` and ship a migration note in CHANGELOG.
4. **One verify command.** CI and local both run `pnpm verify` (`verify/verify.sh`).
5. **No secrets in manifests or fixtures.** Tool bindings may point at public routes; never embed tokens.
6. **MIT and free.** Do not add paid-only core paths. Optional remote adapters must degrade to local static analysis.

## Landmine map

| Area | Why it bites |
|---|---|
| `src/runtime/*` | Runs in the browser; keep Node-only imports out of the IIFE bundle |
| `src/analyze/*` | Heuristics over HTML/JSX; prefer more drafts over false "sure" tools |
| `halite publish` | Copies `dist/halite.runtime*.js` — build before publish in docs/examples |
| WebMCP API surface | Spec uses `document.modelContext`; some docs say `navigator.modelContext` — support both |

## House style

- Match the surrounding code's idiom, naming, and comment density.
- No demo scaffolding, no leftover diagnostics, no dead flags.
- Comments state constraints the code can't show — never narration.
- User-facing copy states the thing plainly; no reassurance microcopy.

## Process rules

- Branch from `main`; never commit to it directly.
- `pnpm verify` green before every push. Flaky gate → fix or
  quarantine in the same PR; never route around it.
- After adding/removing/renaming source files, run the stack's
  regeneration step (project gen, lockfile, tidy) and commit the result.
- Commit at boundaries; message says what changed and cites evidence.
- Docs move with behavior — same commit or PR.
- Report outcomes faithfully; failing is failing, with output.
