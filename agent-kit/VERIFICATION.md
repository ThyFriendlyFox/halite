# VERIFICATION.md — one command answers "is this repo healthy"

`pnpm verify` runs, in order:

1. Lint / format check — `pnpm lint` (`tsc --noEmit` + style word gate)
2. Build — `pnpm build`
3. Tests — `pnpm test`
4. Smoke — `halite analyze` on `tests/fixtures/html-site` must emit ≥1 tool

Live third-party pages are **not** part of verify. Run them with
`pnpm live-bench` (see `benchmarks/README.md` and
`agent-kit/workflows/live-bench.yml`).

## Rules

- CI runs **the same command** as local. No CI-only logic.
- A gate that can't run in some environment **skips loudly**, never
  passes silently.
- New behavior lands with its gate in the same PR whenever feasible.
- A feature's completion promise (ROADMAP.md) should be backed by a gate
  here whenever it can be — evidence that keeps proving itself beats
  evidence produced once.
- Fixing a flaky or broken gate is always in scope, for any task.
