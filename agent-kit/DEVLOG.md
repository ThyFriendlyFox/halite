# DEVLOG.md — the live devlog

The plain history of this project. A person who knows nothing about the
code reads this file and knows what happened, in order, with no jargon.
Append only. Never rewrite an old entry — a wrong entry gets a
correction entry, not an edit.

Write every entry in the voice of `TONE.md`.

## Entry shape

Every entry has the same shape:

```
## YYYY-MM-DD — <one line: what happened>

<What we did. What worked. What broke. What we learned.
3–10 short sentences. Plain words. Past tense for what happened,
present tense for how things now stand.>

Evidence: <commit / tag / gate run / screenshot>
```

## When to write

- Every WEEKLY.md cycle writes one entry at step 5 (before merge).
- A failed or abandoned attempt gets an entry too. The devlog records
  what happened, not what succeeded. A week with no shipped feature
  still gets its entry.
- Out-of-band work (security patch, gate repair, big triage) gets one.
- SETUP.md writes the first entry: "Installed the agent kit."

## What does not go here

- Code detail that belongs in commit messages.
- Promises about the future — that is ROADMAP.md.
- State claims — that is STATUS.md. The devlog is the story; STATUS is
  the snapshot.

---

## 2026-08-30 — Live URL analyze works on nano-banner.com

nano-banner.com returned 0 tools under the form-only scanner. I added a
SPA control scanner and `halite analyze --url`, which renders the page in
Chrome, probes the file input, and invents tools. A live run produced 7
drafts: upload, platform, usecase, method, reset, download, share.
`pnpm verify` stays green.

Evidence: `/tmp/nano-banner-analyze.log`; `tests/spa-controls.test.ts`; v0.3.0

## 2026-08-29 — Shipped annotate and schema as v0.2.0

I added `halite annotate` for plain HTML forms and `halite schema` for
editor validation. Both land with tests. The queue now leads with the
crawl adapter. The public repo is ThyFriendlyFox/halite.

Evidence: `tests/schema-annotate.test.ts`, `schemas/halite.manifest.schema.json`

## 2026-08-29 — Installed the agent kit and shipped Halite 0.1.0

I installed agent-kit into a new Halite repository. Halite is a free
open-source answer to Sodium: scan a repo, approve WebMCP tools, publish
one script tag. The static analyzer reads HTML and route files only; it
does not run app code. The first queue holds annotate, crawl adapter,
and schema export. `pnpm verify` is the health gate.

Evidence: package `halite@0.1.0`, `agent-kit/ROADMAP.md` seeded, verify script at `verify/verify.sh`
