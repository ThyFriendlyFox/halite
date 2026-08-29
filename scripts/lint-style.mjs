#!/usr/bin/env node
/**
 * Lightweight STYLE.md term gate for user-facing markdown under docs/ and README.
 * Fails if banned marketing words appear in product docs.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BANNED = [
  /\bsimply\b/i,
  /\brobust\b/i,
  /\bseamless\b/i,
  /\bblazing\b/i,
  /\bdelightful\b/i,
  /\bmagic\b/i,
];

const ROOTS = ["README.md", "agent-kit/docs", "docs"].filter((p) => {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
});

function walk(path) {
  const st = statSync(path);
  if (st.isFile()) return path.endsWith(".md") ? [path] : [];
  const out = [];
  for (const name of readdirSync(path)) {
    if (name === "node_modules" || name === ".git") continue;
    out.push(...walk(join(path, name)));
  }
  return out;
}

let failed = false;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const text = readFileSync(file, "utf8");
    for (const re of BANNED) {
      if (re.test(text)) {
        console.error(`style: banned word ${re} in ${file}`);
        failed = true;
      }
    }
  }
}

if (failed) process.exit(1);
console.log("style ok");
