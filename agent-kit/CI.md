# CI.md — source blocks for .github/

Copy `agent-kit/workflows/*.yml` into `.github/workflows/` when the pusher
has the GitHub `workflow` scope. Until then, the runnable templates live
under `agent-kit/workflows/`. Verify step matches local `pnpm verify`.

Workflows:

| File | Role |
|---|---|
| `ci.yml` | PR/push: `pnpm verify` only (no network to third-party sites) |
| `live-bench.yml` | Nightly / manual / label `live-bench`: public URL bench |
| `release.yml` | Tag release artifacts |

## `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
permissions:
  contents: read
jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Verify
        run: pnpm verify
```

## `.github/workflows/nightly.yml`

```yaml
name: Nightly
on:
  schedule:
    - cron: '17 6 * * *'
  workflow_dispatch:
permissions:
  contents: read
  issues: write
jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Verify
        run: pnpm verify
      - name: File issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            const open = await github.rest.issues.listForRepo({ ...context.repo, labels: 'ci-failure', state: 'open' });
            if (open.data.length === 0) {
              await github.rest.issues.create({ ...context.repo,
                title: `Nightly verify failed — ${new Date().toISOString().slice(0,10)}`,
                labels: ['ci-failure'],
                body: `Run: ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}` });
            }
```

## `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    tags: ['v*.*.*']
permissions:
  contents: write
jobs:
  release:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Build artifacts
        run: pnpm build
      - name: Publish GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          files: |
            dist/cli.js
            dist/halite.runtime.global.js
```

## `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule: { interval: weekly }
    groups:
      minor-and-patch:
        update-types: ["minor", "patch"]
  - package-ecosystem: github-actions
    directory: "/"
    schedule: { interval: weekly }
```
