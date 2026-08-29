# Releasing

The weekly cycle (WEEKLY.md step 7) ends here. Weekly update = **minor**
by default; **major** if breaking; out-of-band fixes = patch.
(Pre-1.0: breaking → minor, everything else → patch.)

1. `main` green: `pnpm verify`.
2. CHANGELOG.md: Unreleased → `## [X.Y.Z] - YYYY-MM-DD`.
3. Bump `version` in `package.json`.
4. Commit `chore: release vX.Y.Z`; tag `vX.Y.Z`; push branch + tag.
5. `release.yml` builds artifacts and publishes the GitHub Release from the tag.
6. `npm publish` when the maintainer is ready (Evidence: install from registry).
7. STATUS.md "Last release" gets the new tag; ROADMAP.md Shipped table
   gets the release column filled.
