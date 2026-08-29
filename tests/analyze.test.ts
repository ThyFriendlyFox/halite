import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeRepository } from "../src/analyze/index.ts";
import {
  emptyManifest,
  parseManifest,
} from "../src/schema/manifest.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(here, "fixtures/html-site");

describe("analyzeRepository", () => {
  it("finds forms, declarative tools, buttons, and API routes", () => {
    const tools = analyzeRepository({ root: fixture });
    const names = new Set(tools.map((t) => t.name));
    assert.ok(names.has("submit_contact"), `got ${[...names]}`);
    assert.ok(
      [...names].some((n) => n.includes("search") || n.includes("submit")),
      `expected search/submit tool in ${[...names]}`,
    );
    assert.ok(names.has("add_to_cart"), `got ${[...names]}`);
    assert.ok(
      [...names].some((n) => n.includes("cart")),
      `expected cart API tool in ${[...names]}`,
    );
    assert.ok(tools.length >= 3);
  });

  it("marks GET API tools as read", () => {
    const tools = analyzeRepository({ root: fixture });
    const getCart = tools.find(
      (t) => t.source?.kind === "api" && t.binding?.method === "GET",
    );
    assert.ok(getCart);
    assert.equal(getCart.safety, "read");
  });
});

describe("manifest schema", () => {
  it("round-trips a valid manifest", () => {
    const m = emptyManifest("demo");
    m.tools.push({
      name: "ping",
      description: "Ping",
      inputSchema: { type: "object", properties: {} },
      safety: "read",
      requireConfirmation: false,
      status: "approved",
    });
    const parsed = parseManifest(JSON.parse(JSON.stringify(m)));
    assert.equal(parsed.tools[0]?.name, "ping");
  });

  it("rejects bad tool names", () => {
    assert.throws(() =>
      parseManifest({
        schemaVersion: 1,
        name: "x",
        version: "1",
        createdAt: new Date().toISOString(),
        tools: [
          {
            name: "Bad Name",
            description: "x",
            inputSchema: { type: "object", properties: {} },
          },
        ],
      }),
    );
  });
});

describe("fixture file layout", () => {
  it("ships index.html", async () => {
    const { readFileSync, existsSync } = await import("node:fs");
    assert.equal(existsSync(join(fixture, "index.html")), true);
    const html = readFileSync(join(fixture, "index.html"), "utf8");
    assert.match(html, /toolname="submit_contact"/);
  });
});
