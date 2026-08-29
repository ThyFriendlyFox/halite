#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== lint =="
pnpm lint

echo "== build =="
pnpm build

echo "== test =="
pnpm test

echo "== smoke: analyze fixture =="
node dist/cli.js analyze tests/fixtures/html-site -o /tmp/halite-smoke.json
node -e '
import { readFileSync } from "node:fs";
const m = JSON.parse(readFileSync("/tmp/halite-smoke.json","utf8"));
if (!m.tools?.length) { console.error("expected tools"); process.exit(1); }
console.log("smoke ok:", m.tools.length, "tools");
'

echo "verify ok"
