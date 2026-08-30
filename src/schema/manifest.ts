import { z } from "zod";

/** JSON Schema fragment for tool inputs (subset of JSON Schema draft-07). */
export const JsonSchemaObject = z
  .object({
    type: z.literal("object"),
    properties: z.record(z.unknown()).default({}),
    required: z.array(z.string()).optional(),
    additionalProperties: z.boolean().optional(),
  })
  .passthrough();

export const ToolSafety = z.enum(["read", "write", "danger"]);

export const ToolSource = z.object({
  kind: z.enum(["form", "button", "route", "api", "manual", "html", "dom"]),
  path: z.string().optional(),
  selector: z.string().optional(),
  line: z.number().int().positive().optional(),
});

export const HaliteTool = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/, "tool names use snake_case"),
  description: z.string().min(1),
  inputSchema: JsonSchemaObject,
  safety: ToolSafety.default("write"),
  /** When true, runtime asks the user before execute. */
  requireConfirmation: z.boolean().default(false),
  /** How the analyzer found this tool. */
  source: ToolSource.optional(),
  /** DOM binding for form/button/control tools. */
  binding: z
    .object({
      type: z.enum(["form", "click", "navigate", "custom", "set", "upload"]),
      selector: z.string().optional(),
      href: z.string().optional(),
      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
      action: z.string().optional(),
      /** For set tools: which arg holds the value (default value). */
      valueKey: z.string().optional(),
      /** For radio groups: the shared name attribute. */
      name: z.string().optional(),
      /** For upload tools: accept attribute hint. */
      accept: z.string().optional(),
    })
    .optional(),
  /** Approval state in the local publish workflow. */
  status: z.enum(["draft", "approved", "rejected"]).default("draft"),
});

export const HaliteManifest = z.object({
  schemaVersion: z.literal(1),
  name: z.string().min(1),
  version: z.string().min(1),
  createdAt: z.string(),
  siteOrigin: z.string().optional(),
  tools: z.array(HaliteTool),
});

export type HaliteTool = z.infer<typeof HaliteTool>;
export type HaliteManifest = z.infer<typeof HaliteManifest>;
export type ToolSafety = z.infer<typeof ToolSafety>;

export function parseManifest(data: unknown): HaliteManifest {
  return HaliteManifest.parse(data);
}

export function emptyManifest(
  name: string,
  version = "0.0.1",
): HaliteManifest {
  return {
    schemaVersion: 1,
    name,
    version,
    createdAt: new Date().toISOString(),
    tools: [],
  };
}
