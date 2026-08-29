import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Command } from "commander";
import { analyzeRepository } from "./analyze/index.js";
import {
  emptyManifest,
  parseManifest,
  type HaliteManifest,
  type HaliteTool,
} from "./schema/manifest.js";
import { emitScriptTag } from "./runtime/index.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function bumpPatch(version: string): string {
  const parts = version.split(".").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return `${version}.1`;
  }
  const [a, b, c] = parts as [number, number, number];
  return `${a}.${b}.${c + 1}`;
}

function loadOrCreate(path: string, name: string): HaliteManifest {
  if (existsSync(path)) {
    return parseManifest(readJson(path));
  }
  return emptyManifest(name);
}

function mergeTools(
  existing: HaliteTool[],
  discovered: HaliteTool[],
): HaliteTool[] {
  const byName = new Map(existing.map((t) => [t.name, t]));
  for (const tool of discovered) {
    const prev = byName.get(tool.name);
    if (!prev) {
      byName.set(tool.name, tool);
      continue;
    }
    // Keep approval status; refresh description/schema/binding from scan
    byName.set(tool.name, {
      ...tool,
      status: prev.status,
      requireConfirmation:
        prev.requireConfirmation || tool.requireConfirmation,
    });
  }
  return [...byName.values()];
}

const program = new Command();
program
  .name("halite")
  .description(
    "Free open-source Sodium alternative: turn site features into WebMCP tools",
  )
  .version(pkg.version);

program
  .command("analyze")
  .description("Scan a local repository and write a draft Halite manifest")
  .argument("[root]", "repository or site root", ".")
  .option("-o, --out <file>", "manifest output path", "halite.tools.json")
  .option("-n, --name <name>", "manifest name")
  .option("--json", "print tools as JSON to stdout", false)
  .action((root: string, opts: { out: string; name?: string; json?: boolean }) => {
    const abs = resolve(root);
    const tools = analyzeRepository({ root: abs });
    const out = resolve(opts.out);
    const name = opts.name ?? abs.split(/[/\\]/).filter(Boolean).at(-1) ?? "site";
    const prev = loadOrCreate(out, name);
    const merged = mergeTools(prev.tools, tools);
    const next: HaliteManifest = {
      ...prev,
      name,
      version: prev.tools.length ? bumpPatch(prev.version) : prev.version,
      createdAt: new Date().toISOString(),
      tools: merged,
    };
    writeJson(out, next);
    if (opts.json) {
      process.stdout.write(`${JSON.stringify(next, null, 2)}\n`);
    } else {
      const draft = merged.filter((t) => t.status === "draft").length;
      const approved = merged.filter((t) => t.status === "approved").length;
      console.log(`Wrote ${out}`);
      console.log(
        `Found ${merged.length} tool(s): ${approved} approved, ${draft} draft`,
      );
      for (const t of merged) {
        const mark =
          t.status === "approved" ? "✔" : t.status === "rejected" ? "✖" : "·";
        console.log(
          `  ${mark} ${t.name.padEnd(28)} ${t.safety.padEnd(6)} ${t.description}`,
        );
      }
    }
  });

program
  .command("approve")
  .description("Approve draft tools by name (or --all)")
  .argument("[names...]", "tool names to approve")
  .option("-m, --manifest <file>", "manifest path", "halite.tools.json")
  .option("--all", "approve every draft tool", false)
  .action((names: string[], opts: { manifest: string; all?: boolean }) => {
    const path = resolve(opts.manifest);
    const manifest = parseManifest(readJson(path));
    const set = new Set(names);
    let count = 0;
    for (const tool of manifest.tools) {
      if (tool.status === "rejected") continue;
      if (opts.all || set.has(tool.name)) {
        if (tool.status !== "approved") count += 1;
        tool.status = "approved";
      }
    }
    manifest.version = bumpPatch(manifest.version);
    manifest.createdAt = new Date().toISOString();
    writeJson(path, manifest);
    console.log(`Approved ${count} tool(s) in ${path} (v${manifest.version})`);
  });

program
  .command("reject")
  .description("Reject tools by name so they stay unpublished")
  .argument("<names...>", "tool names to reject")
  .option("-m, --manifest <file>", "manifest path", "halite.tools.json")
  .action((names: string[], opts: { manifest: string }) => {
    const path = resolve(opts.manifest);
    const manifest = parseManifest(readJson(path));
    const set = new Set(names);
    let count = 0;
    for (const tool of manifest.tools) {
      if (set.has(tool.name)) {
        tool.status = "rejected";
        count += 1;
      }
    }
    writeJson(path, manifest);
    console.log(`Rejected ${count} tool(s) in ${path}`);
  });

program
  .command("emit")
  .description("Print the one-line script tag for an approved manifest")
  .option("-m, --manifest <file>", "manifest path", "halite.tools.json")
  .option(
    "--url <url>",
    "public URL where the manifest will be hosted",
    "/halite.tools.json",
  )
  .option("--runtime-url <url>", "URL of halite.runtime.js", "/halite.runtime.js")
  .action((opts: { manifest: string; url: string; runtimeUrl: string }) => {
    const path = resolve(opts.manifest);
    const manifest = parseManifest(readJson(path));
    const approved = manifest.tools.filter((t) => t.status === "approved");
    if (approved.length === 0) {
      console.error("No approved tools. Run: halite approve --all");
      process.exitCode = 1;
      return;
    }
    const tag = `<script src="${opts.runtimeUrl}" data-halite-manifest="${opts.url}" defer></script>`;
    console.log(tag);
    console.log(`# ${approved.length} approved tool(s), manifest v${manifest.version}`);
  });

program
  .command("publish")
  .description(
    "Write a publish snapshot (approved-only) for hosting next to your site",
  )
  .option("-m, --manifest <file>", "manifest path", "halite.tools.json")
  .option(
    "-o, --out <dir>",
    "output directory for published artifacts",
    "halite-publish",
  )
  .action((opts: { manifest: string; out: string }) => {
    const path = resolve(opts.manifest);
    const manifest = parseManifest(readJson(path));
    const approved = manifest.tools.filter((t) => t.status === "approved");
    if (approved.length === 0) {
      console.error("No approved tools. Run: halite approve --all");
      process.exitCode = 1;
      return;
    }
    const outDir = resolve(opts.out);
    mkdirSync(outDir, { recursive: true });
    const published: HaliteManifest = {
      ...manifest,
      tools: approved,
    };
    const versioned = join(outDir, `halite.tools.v${manifest.version}.json`);
    const latest = join(outDir, "halite.tools.json");
    writeJson(versioned, published);
    writeJson(latest, published);

    // Copy runtime if built
    const runtimeSrc = resolve("dist/halite.runtime.global.js");
    const runtimeAlt = resolve("dist/halite.runtime.js");
    const runtime =
      existsSync(runtimeSrc) ? runtimeSrc : existsSync(runtimeAlt) ? runtimeAlt : null;
    if (runtime) {
      writeFileSync(join(outDir, "halite.runtime.js"), readFileSync(runtime));
    }

    const versionsPath = join(outDir, "versions.json");
    const versions = existsSync(versionsPath)
      ? (readJson(versionsPath) as { versions: string[] })
      : { versions: [] as string[] };
    if (!versions.versions.includes(manifest.version)) {
      versions.versions.unshift(manifest.version);
    }
    writeJson(versionsPath, versions);

    writeFileSync(
      join(outDir, "snippet.html"),
      `${emitScriptTag("halite.tools.json").replace(
        "halite.runtime.js",
        "halite.runtime.js",
      )}\n`,
    );

    console.log(`Published ${approved.length} tool(s) to ${outDir}`);
    console.log(`  latest:  ${latest}`);
    console.log(`  version: ${versioned}`);
    console.log(`  history: ${versions.versions.join(", ")}`);
  });

program
  .command("rollback")
  .description("Restore a published version into the latest manifest file")
  .argument("<version>", "version to restore (e.g. 0.0.3)")
  .option(
    "-d, --dir <dir>",
    "publish directory",
    "halite-publish",
  )
  .action((version: string, opts: { dir: string }) => {
    const dir = resolve(opts.dir);
    const file = join(dir, `halite.tools.v${version}.json`);
    if (!existsSync(file)) {
      console.error(`Missing ${file}`);
      process.exitCode = 1;
      return;
    }
    const manifest = parseManifest(readJson(file));
    writeJson(join(dir, "halite.tools.json"), manifest);
    console.log(`Rolled back latest → v${version} (${manifest.tools.length} tools)`);
  });

program.parse();
