/** JSON Schema for Halite manifests (schemaVersion 1). */
export const MANIFEST_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://raw.githubusercontent.com/ThyFriendlyFox/halite/main/schemas/halite.manifest.schema.json",
  title: "HaliteManifest",
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "name", "version", "createdAt", "tools"],
  properties: {
    schemaVersion: { const: 1 },
    name: { type: "string", minLength: 1 },
    version: { type: "string", minLength: 1 },
    createdAt: { type: "string", minLength: 1 },
    siteOrigin: { type: "string" },
    tools: {
      type: "array",
      items: { $ref: "#/definitions/HaliteTool" },
    },
  },
  definitions: {
    HaliteTool: {
      type: "object",
      additionalProperties: false,
      required: ["name", "description", "inputSchema"],
      properties: {
        name: {
          type: "string",
          pattern: "^[a-z][a-z0-9_]*$",
        },
        description: { type: "string", minLength: 1 },
        inputSchema: {
          type: "object",
          required: ["type"],
          properties: {
            type: { const: "object" },
            properties: { type: "object" },
            required: {
              type: "array",
              items: { type: "string" },
            },
            additionalProperties: { type: "boolean" },
          },
          additionalProperties: true,
        },
        safety: { enum: ["read", "write", "danger"], default: "write" },
        requireConfirmation: { type: "boolean", default: false },
        source: {
          type: "object",
          properties: {
            kind: {
              enum: ["form", "button", "route", "api", "manual", "html"],
            },
            path: { type: "string" },
            selector: { type: "string" },
            line: { type: "integer", minimum: 1 },
          },
          required: ["kind"],
          additionalProperties: false,
        },
        binding: {
          type: "object",
          properties: {
            type: { enum: ["form", "click", "navigate", "custom"] },
            selector: { type: "string" },
            href: { type: "string" },
            method: { enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
            action: { type: "string" },
          },
          required: ["type"],
          additionalProperties: false,
        },
        status: {
          enum: ["draft", "approved", "rejected"],
          default: "draft",
        },
      },
    },
  },
} as const;

export function manifestJsonSchema(): typeof MANIFEST_JSON_SCHEMA {
  return MANIFEST_JSON_SCHEMA;
}
