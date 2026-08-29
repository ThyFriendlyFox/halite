/**
 * Analyzer adapters: pluggable discovery backends.
 * The default `static` adapter never runs project code.
 */

import type { HaliteTool } from "../schema/manifest.js";
import { analyzeRepository, type AnalyzeOptions } from "../analyze/index.js";

export type AnalyzerAdapter = {
  id: string;
  analyze: (options: AnalyzeOptions) => Promise<HaliteTool[]> | HaliteTool[];
};

export const staticAdapter: AnalyzerAdapter = {
  id: "static",
  analyze: (options) => analyzeRepository(options),
};

const registry = new Map<string, AnalyzerAdapter>([
  [staticAdapter.id, staticAdapter],
]);

export function registerAnalyzer(adapter: AnalyzerAdapter) {
  registry.set(adapter.id, adapter);
}

export function getAnalyzer(id: string): AnalyzerAdapter {
  const adapter = registry.get(id);
  if (!adapter) {
    throw new Error(
      `Unknown analyzer adapter "${id}". Known: ${[...registry.keys()].join(", ")}`,
    );
  }
  return adapter;
}

export function listAnalyzers(): string[] {
  return [...registry.keys()];
}
