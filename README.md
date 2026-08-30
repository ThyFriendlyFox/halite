# Halite

Free, open-source WebMCP tooling. Analyze a local site or repository, approve the tools you want agents to call, and ship **one script tag**.

Halite turns website features into WebMCP tools AI agents can use: analyze a site or repo, approve tools, ship one script tag. Free and open source (MIT).

## Why

[WebMCP](https://webmachinelearning.github.io/webmcp/) lets a page register structured tools for AI agents in the browser. Halite finds candidate tools in HTML forms, SPA controls (buttons, selects,
file inputs, radios), and API routes, then publishes an approved manifest
the runtime registers with `document.modelContext` / `navigator.modelContext`.

## Install

```bash
npm install -g halite
# or
npx halite --help
```

Node 20+.

## 2-minute setup

```bash
# 1. Scan your repo (never runs your app code)
halite analyze . -o halite.tools.json

# Or scan a live public page (needs Chrome):
# tip: probes file inputs so SPA UIs like nano-banner.com reveal their controls
halite analyze --url https://www.nano-banner.com/ -o halite.tools.json

# 2. Approve what agents may call
halite approve --all

# 3. Write hostable artifacts
halite publish -o public/halite

# 4. Add one line to your HTML
# <script src="/halite/halite.runtime.js" data-halite-manifest="/halite/halite.tools.json" defer></script>
```

Print the tag:

```bash
halite emit --url /halite/halite.tools.json --runtime-url /halite/halite.runtime.js
```

Roll back a publish:

```bash
halite rollback 0.0.3 -d public/halite
```

## Chrome WebMCP

1. Chrome 146+ (or current Canary/early preview).
2. Enable `chrome://flags/#enable-webmcp-testing`.
3. Relaunch. Open your page. Agents (and the WebMCP inspector) see approved tools.

## Library API

```ts
import { analyzeRepository, parseManifest, registerManifest } from "halite";

const tools = analyzeRepository({ root: "." });
```

Browser:

```ts
import { registerManifest } from "halite/runtime";
await registerManifest(manifest, { approvedOnly: true });
```

## Commands

| Command | Task |
|---|---|
| `halite analyze [root]` | Static scan → draft manifest |
| `halite analyze --url <https>` | Render a live page → draft manifest |
| `halite annotate <file>` | Add declarative tool attrs to HTML forms |
| `halite schema` | Print manifest JSON Schema |
| `halite approve [names…]` | Mark tools approved (`--all`) |
| `halite reject <names…>` | Keep tools unpublished |
| `halite emit` | Print the script tag |
| `halite publish` | Write approved snapshot + version history |
| `halite rollback <ver>` | Restore a published version |

## Safety

- Analysis is static. Halite does not execute your repository.
- `danger` / `requireConfirmation` tools prompt the user in the runtime before execute.
- Only `status: "approved"` tools register by default.

## Develop

```bash
pnpm install
pnpm verify   # lint → build → test → smoke
```

Agent workflow lives in `agent-kit/` (`ROUTING.md` first).

## License

MIT. Free for commercial and personal use.
