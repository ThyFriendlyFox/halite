#!/usr/bin/env node
/**
 * Live-site bench for Halite.
 *
 * Design:
 * - Reads benchmarks/live-sites.json
 * - Runs `halite analyze --url` per site (via library API)
 * - core tier failures fail the process
 * - soft tier failures are reported but do not fail the job
 * - Writes manifests + summary under benchmarks/out/ (gitignored)
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeUrl } from "../dist/analyze/index.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "benchmarks/live-sites.json");
const outDir = join(root, "benchmarks/out");
const only = process.env.HALITE_LIVE_ONLY?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const tierFilter = process.env.HALITE_LIVE_TIER; // core | soft | unset=all

mkdirSync(outDir, { recursive: true });

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const defaults = catalog.defaults ?? {};

/** @type {any[]} */
const results = [];

function nameHits(names, needles) {
  if (!needles?.length) return { ok: true, missing: [] };
  const missing = needles.filter(
    (n) => !names.some((name) => name.includes(n)),
  );
  // Pass if at least half of the expected needles appear (sites drift).
  const hit = needles.length - missing.length;
  const ok = hit >= Math.ceil(needles.length / 2);
  return { ok, missing, hit, need: needles.length };
}

let coreFailed = 0;
let softFailed = 0;

for (const site of catalog.sites) {
  if (only?.length && !only.includes(site.id)) continue;
  if (tierFilter && site.tier !== tierFilter) continue;

  const probe = site.probe ?? defaults.probe ?? true;
  const timeoutMs = site.timeoutMs ?? defaults.timeoutMs ?? 60000;
  const minTools = site.minTools ?? defaults.minTools ?? 1;
  const started = Date.now();
  /** @type {any} */
  let row = {
    id: site.id,
    url: site.url,
    tier: site.tier,
    kind: site.kind,
  };

  try {
    console.log(`\n== ${site.id} (${site.tier}) ${site.url}`);
    const { tools } = await analyzeUrl({
      url: site.url,
      probe,
      timeoutMs,
    });
    const names = tools.map((t) => t.name);
    const manifest = {
      schemaVersion: 1,
      name: site.id,
      version: "bench",
      createdAt: new Date().toISOString(),
      siteOrigin: site.url,
      tools,
    };
    writeFileSync(
      join(outDir, `${site.id}.tools.json`),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );

    const expect = nameHits(names, site.expectNameContains);
    const tooFew = tools.length < minTools;
    const tooMany =
      site.maxTools != null ? tools.length > site.maxTools : false;
    const ok = !tooFew && !tooMany && expect.ok;

    row = {
      ...row,
      ok,
      ms: Date.now() - started,
      toolCount: tools.length,
      names,
      minTools,
      maxTools: site.maxTools ?? null,
      expect,
      error: null,
    };

    if (!ok) {
      if (site.tier === "core") coreFailed += 1;
      else softFailed += 1;
      console.log(
        `  FAIL tools=${tools.length} min=${minTools}` +
          (tooMany ? ` max=${site.maxTools}` : "") +
          (expect.missing?.length
            ? ` missing~${expect.missing.join(",")}`
            : ""),
      );
    } else {
      console.log(`  ok tools=${tools.length} ${names.join(", ")}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    row = {
      ...row,
      ok: false,
      ms: Date.now() - started,
      toolCount: 0,
      names: [],
      error: message,
    };
    if (site.tier === "core") coreFailed += 1;
    else softFailed += 1;
    console.log(`  ERROR ${message}`);
  }

  results.push(row);
}

const summary = {
  generatedAt: new Date().toISOString(),
  coreFailed,
  softFailed,
  results,
};

writeFileSync(join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

console.log("\n== summary ==");
console.log(
  `core_failed=${coreFailed} soft_failed=${softFailed} ran=${results.length}`,
);
console.log(`wrote ${join(outDir, "summary.json")}`);

if (coreFailed > 0) {
  process.exitCode = 1;
}
