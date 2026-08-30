# Changelog

All notable changes to Halite are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/) · Versioning: [SemVer](https://semver.org/).

## [Unreleased]
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [0.3.0] - 2026-08-30
### Added
- `halite analyze --url` renders a public page in Chrome and invents tools from the live DOM.
- SPA control scanner for buttons, selects, file inputs, and radio groups (no `<form>` required).
- Runtime bindings `set` and `upload` for those controls.
- Optional file-input probe (`--no-probe` to disable) so post-upload UI is visible.

## [0.2.0] - 2026-08-29
### Added
- `halite annotate` writes `toolname` / `tooldescription` onto plain HTML forms.
- `halite schema` prints the manifest JSON Schema; checked in at `schemas/halite.manifest.schema.json`.

## [0.1.0] - 2026-08-29
### Added
- `halite analyze` static repository scanner (HTML forms, declarative WebMCP attrs, data-halite buttons, API routes).
- `halite approve` / `reject` / `emit` / `publish` / `rollback` workflow.
- Browser runtime that registers approved tools with WebMCP (`document.modelContext` or `navigator.modelContext`).
- MIT-licensed package, agent-kit, and verification gate.
