# Architecture

Halite is a Node CLI plus a browser runtime. The code has 4 parts.

| Part | Folder | Task |
|---|---|---|
| Schema | `src/schema` | Manifest Zod types and parse helpers |
| Analyze | `src/analyze` | Static scan of local files → draft tools |
| Runtime | `src/runtime` | Register approved tools with WebMCP |
| CLI | `src/cli.ts` | analyze / approve / emit / publish / rollback |
| Adapters | `src/adapters` | Pluggable analyzers (default: `static`) |

## Data flow

1. User runs `halite analyze <root>`.
2. Static analyzer walks HTML/JSX/API files and builds draft `HaliteTool`s.
3. User runs `halite approve` to flip `status` to `approved`.
4. `halite publish` writes approved-only JSON plus version history.
5. Page loads `halite.runtime.js` with `data-halite-manifest`.
6. Runtime calls `modelContext.registerTool` for each approved tool.
7. An agent invokes a tool; binding fills a form, clicks, or fetches.

## Boundaries

| Boundary | Rule |
|---|---|
| analyze ↔ app code | Analysis reads files only; never executes the app |
| publish ↔ runtime | Runtime trusts manifest JSON; only approved tools register by default |
| adapters ↔ CLI | CLI selects an adapter by id; adapters return `HaliteTool[]` |
| browser ↔ Node | Browser bundle must not import `node:*` |
