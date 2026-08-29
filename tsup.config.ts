import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      "analyze/index": "src/analyze/index.ts",
      "runtime/index": "src/runtime/index.ts",
    },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    target: "node20",
    platform: "node",
  },
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    dts: false,
    sourcemap: true,
    clean: false,
    target: "node20",
    platform: "node",
    banner: { js: "#!/usr/bin/env node" },
  },
  {
    entry: { "halite.runtime": "src/runtime/browser.ts" },
    format: ["iife"],
    globalName: "Halite",
    dts: false,
    sourcemap: true,
    clean: false,
    target: "es2020",
    platform: "browser",
    outDir: "dist",
  },
]);
