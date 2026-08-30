# Configuration

Halite reads flags on the CLI and optional fields on the manifest.
There is no required config file for the core workflow.

| Platform | Path |
|---|---|
| Any | Working directory + CLI flags |
| Publish output | `halite-publish/` (or `--out`) |

A missing manifest on `analyze` creates a new one. A damaged manifest
fails parse with a Zod error; the CLI exits non-zero and does not overwrite.

## Fields

| Field | Type | Default | Use |
|---|---|---|---|
| `analyze --url` | url | unset | Render a public page and invent tools from the live DOM |
| `analyze --no-probe` | bool | false | Skip tiny file-input probe during `--url` |
| `analyze --out` | path | `halite.tools.json` | Manifest write path |
| `analyze --name` | string | directory name | Manifest `name` |
| `approve --manifest` | path | `halite.tools.json` | Manifest to update |
| `approve --all` | bool | false | Approve every draft tool |
| `annotate --dry-run` | bool | false | Print annotated HTML without write |
| `emit --url` | string | `/halite.tools.json` | Manifest URL in script tag |
| `emit --runtime-url` | string | `/halite.runtime.js` | Runtime URL in script tag |
| `publish --out` | path | `halite-publish` | Hostable artifact directory |
| `rollback --dir` | path | `halite-publish` | Publish directory to restore |
| script `data-halite-manifest` | URL | required | Manifest fetch URL |
| script `data-halite-approved-only` | `"true"`/`"false"` | true | Registration filter |
| tool `safety` | `read`/`write`/`danger` | `write` | Agent hints + confirm |
| tool `requireConfirmation` | bool | false | `window.confirm` before execute |
| tool `status` | `draft`/`approved`/`rejected` | `draft` | Publish filter |
