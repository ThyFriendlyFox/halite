# Use cases

Each case has the same shape.
**Scan / Approve / Ship** — find tools, choose which agents may call, put them on the page.

## Publish forms on a marketing site

**Scan.** Run `halite analyze` on the site root. Halite drafts tools from HTML forms.
**Approve.** Run `halite approve --all` (or named tools). Run `halite publish` and add the script tag.

## Expose a Next.js API route to agents

**Scan.** Point analyze at the app repo. Route handlers become draft tools.
**Approve.** Approve read routes first. Keep mutating routes on confirmation.

## Annotate forms

**Scan.** Prefer declarative `toolname` attributes on forms you own.
**Approve.** Re-analyze; declarative tools keep stable names for approval.

## Crawl a live page

**Scan.** Use the crawl adapter on a public URL when source is unavailable.
**Approve.** Same approve/publish path as static analysis.

## Hand-author tools

**Scan.** Skip analyze; write `halite.tools.json` by hand against the schema.
**Approve.** Set `status` to `approved` and publish.

## Roll back a bad publish

**Scan.** N/A.
**Approve.** Run `halite rollback <version>` in the publish directory.

## Reject a dangerous action

**Scan.** Analyzer may draft a delete/checkout tool.
**Approve.** `halite reject <name>` so publish omits it.

## CI re-scan on push

**Scan.** Run `halite analyze` in CI and open a PR with the new draft manifest.
**Approve.** A human approves in review; publish stays a separate step.
