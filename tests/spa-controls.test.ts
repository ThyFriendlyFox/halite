import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { analyzeRepository } from "../src/analyze/index.ts";
import { inventoryFromHtml } from "../src/analyze/html-controls.ts";
import { toolsFromInventory } from "../src/analyze/dom-tools.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(here, "fixtures/spa-controls");

describe("SPA control inventory", () => {
  it("finds file, selects, radios, and action buttons", () => {
    const html = readFileSync(resolve(fixture, "index.html"), "utf8");
    const inv = inventoryFromHtml(html, "index.html");
    const kinds = inv.controls.map((c) => c.kind).sort();
    assert.ok(kinds.includes("file"));
    assert.ok(kinds.includes("select"));
    assert.ok(kinds.includes("radio-group"));
    assert.ok(kinds.includes("button"));
    const tools = toolsFromInventory(inv);
    const names = new Set(tools.map((t) => t.name));
    assert.ok([...names].some((n) => n.startsWith("upload_")), [...names]);
    assert.ok(names.has("set_platform"), [...names]);
    assert.ok(names.has("set_usecase"), [...names]);
    assert.ok(names.has("set_method"), [...names]);
    assert.ok(names.has("click_download"), [...names]);
    assert.ok(names.has("click_reset"), [...names]);
    assert.ok(names.has("click_share"), [...names]);
    assert.ok(tools.length >= 5, `expected ≥5 tools, got ${tools.length}`);
  });

  it("analyzeRepository returns the SPA tools from the fixture", () => {
    const tools = analyzeRepository({ root: fixture });
    assert.ok(tools.length >= 5, `got ${tools.map((t) => t.name)}`);
  });
});
