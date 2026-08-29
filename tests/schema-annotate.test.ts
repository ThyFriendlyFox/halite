import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { annotateHtml } from "../src/analyze/annotate.ts";
import { manifestJsonSchema } from "../src/schema/json-schema.ts";

describe("annotateHtml", () => {
  it("adds toolname to plain forms and skips declarative ones", () => {
    const html = `
      <form id="search" aria-label="Search products"><input name="q" /></form>
      <form toolname="submit_contact" tooldescription="x"><input name="email" /></form>
    `;
    const result = annotateHtml(html);
    assert.equal(result.annotated, 1);
    assert.equal(result.skipped, 1);
    assert.ok(result.names.includes("submit_search_products"));
    assert.match(result.content, /toolname="submit_search_products"/);
    assert.match(result.content, /toolname="submit_contact"/);
  });
});

describe("manifestJsonSchema", () => {
  it("exposes $id and required root fields", () => {
    const schema = manifestJsonSchema();
    assert.equal(
      schema.$id,
      "https://raw.githubusercontent.com/ThyFriendlyFox/halite/main/schemas/halite.manifest.schema.json",
    );
    assert.deepEqual(schema.required, [
      "schemaVersion",
      "name",
      "version",
      "createdAt",
      "tools",
    ]);
    assert.equal(schema.properties.schemaVersion.const, 1);
  });
});
