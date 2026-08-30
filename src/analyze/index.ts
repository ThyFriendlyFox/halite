import { readFileSync, existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import fg from "fast-glob";
import type { HaliteTool } from "../schema/manifest.js";
import { inventoryFromHtml } from "./html-controls.js";
import { toolsFromInventory } from "./dom-tools.js";

export type AnalyzeOptions = {
  root: string;
  include?: string[];
  exclude?: string[];
};

export { inventoryFromHtml } from "./html-controls.js";
export { toolsFromInventory } from "./dom-tools.js";
export { analyzeUrl } from "./url.js";

const DEFAULT_INCLUDE = [
  "**/*.html",
  "**/*.htm",
  "**/*.jsx",
  "**/*.tsx",
  "**/*.vue",
  "**/*.svelte",
  "**/*.astro",
];

const DEFAULT_EXCLUDE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.git/**",
  "**/coverage/**",
  "**/.next/**",
];

function slugify(raw: string): string {
  const s = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  if (!s) return "action";
  if (/^[0-9]/.test(s)) return `tool_${s}`;
  return s.slice(0, 48);
}

function uniqueName(base: string, used: Set<string>): string {
  let name = base;
  let i = 2;
  while (used.has(name)) {
    name = `${base}_${i}`;
    i += 1;
  }
  used.add(name);
  return name;
}

type FieldInfo = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

function fieldsToSchema(fields: FieldInfo[]) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const f of fields) {
    properties[f.name] = {
      type: f.type,
      description: f.description,
    };
    if (f.required) required.push(f.name);
  }
  return {
    type: "object" as const,
    properties,
    required: required.length ? required : undefined,
    additionalProperties: false,
  };
}

function extractFormFields(formHtml: string): FieldInfo[] {
  const fields: FieldInfo[] = [];
  const inputRe =
    /<(input|textarea|select)\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = inputRe.exec(formHtml))) {
    const tag = (m[1] ?? "input").toLowerCase();
    const attrs = m[2] ?? "";
    const typeMatch = /\btype\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const nameMatch = /\bname\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const idMatch = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const required = /\brequired\b/i.test(attrs);
    const inputType = (typeMatch?.[1] ?? "text").toLowerCase();
    if (["submit", "button", "reset", "hidden", "image"].includes(inputType)) {
      continue;
    }
    const name = nameMatch?.[1] ?? idMatch?.[1];
    if (!name) continue;
    let jsonType = "string";
    if (inputType === "number" || inputType === "range") jsonType = "number";
    if (inputType === "checkbox") jsonType = "boolean";
    if (tag === "select" && /\bmultiple\b/i.test(attrs)) jsonType = "array";
    fields.push({
      name: slugify(name).replace(/^tool_/, "") || name,
      type: jsonType,
      required,
      description: `${tag} field "${name}" (${inputType})`,
    });
  }
  return fields;
}

function analyzeHtml(content: string, relPath: string, used: Set<string>): HaliteTool[] {
  const tools: HaliteTool[] = [];

  // Declarative WebMCP forms already annotated
  const declarativeRe =
    /<form\b([^>]*\btoolname\s*=\s*["']([^"']+)["'][^>]*)>([\s\S]*?)<\/form>/gi;
  let dm: RegExpExecArray | null;
  while ((dm = declarativeRe.exec(content))) {
    const attrs = dm[1] ?? "";
    const toolName = uniqueName(slugify(dm[2] ?? "form"), used);
    const body = dm[3] ?? "";
    const descMatch = /\btooldescription\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const idMatch = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const actionMatch = /\baction\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const methodMatch = /\bmethod\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const fields = extractFormFields(body);
    tools.push({
      name: toolName,
      description: descMatch?.[1] ?? `Submit the ${toolName} form`,
      inputSchema: fieldsToSchema(fields),
      safety: "write",
      requireConfirmation: false,
      source: { kind: "form", path: relPath },
      binding: {
        type: "form",
        selector: idMatch ? `#${idMatch[1]}` : `form[toolname="${dm[2]}"]`,
        action: actionMatch?.[1],
        method: (methodMatch?.[1]?.toUpperCase() as "GET" | "POST") || "POST",
      },
      status: "draft",
    });
  }

  // Plain forms without toolname
  const formRe = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  let fm: RegExpExecArray | null;
  while ((fm = formRe.exec(content))) {
    const attrs = fm[1] ?? "";
    if (/\btoolname\s*=/i.test(attrs)) continue;
    const body = fm[2] ?? "";
    const idMatch = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const nameAttr = /\bname\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const actionMatch = /\baction\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const methodMatch = /\bmethod\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const aria = /\baria-label\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const base =
      slugify(aria?.[1] ?? nameAttr?.[1] ?? idMatch?.[1] ?? actionMatch?.[1] ?? "submit_form") ||
      "submit_form";
    const name = uniqueName(base.startsWith("submit") ? base : `submit_${base}`, used);
    const fields = extractFormFields(body);
    if (fields.length === 0 && !actionMatch) continue;
    tools.push({
      name,
      description: aria?.[1]
        ? `Submit form: ${aria[1]}`
        : `Submit the ${name.replace(/^submit_/, "")} form on ${relPath}`,
      inputSchema: fieldsToSchema(fields),
      safety: "write",
      requireConfirmation: false,
      source: { kind: "form", path: relPath },
      binding: {
        type: "form",
        selector: idMatch
          ? `#${idMatch[1]}`
          : nameAttr
            ? `form[name="${nameAttr[1]}"]`
            : undefined,
        action: actionMatch?.[1],
        method: (methodMatch?.[1]?.toUpperCase() as "GET" | "POST") || "GET",
      },
      status: "draft",
    });
  }

  // Buttons with clear labels / data-halite-tool
  const btnRe =
    /<button\b([^>]*\b(?:data-halite-tool|data-webmcp-tool)\s*=\s*["']([^"']+)["'][^>]*)>([\s\S]*?)<\/button>/gi;
  let bm: RegExpExecArray | null;
  while ((bm = btnRe.exec(content))) {
    const attrs = bm[1] ?? "";
    const toolName = uniqueName(slugify(bm[2] ?? "click"), used);
    const descMatch =
      /\bdata-(?:halite|webmcp)-description\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const idMatch = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs);
    tools.push({
      name: toolName,
      description: descMatch?.[1] ?? `Activate ${toolName}`,
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      safety: "write",
      requireConfirmation: false,
      source: { kind: "button", path: relPath },
      binding: {
        type: "click",
        selector: idMatch
          ? `#${idMatch[1]}`
          : `button[data-halite-tool="${bm[2]}"],button[data-webmcp-tool="${bm[2]}"]`,
      },
      status: "draft",
    });
  }

  return tools;
}

function analyzeJsx(content: string, relPath: string, used: Set<string>): HaliteTool[] {
  const tools: HaliteTool[] = [];

  // <form onSubmit={...}> or action= patterns with nearby labels
  const formJsxRe = /<form\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = formJsxRe.exec(content))) {
    const attrs = m[1] ?? "";
    const idMatch = /\bid\s*=\s*\{?["'`]([^"'`]+)["'`]\}?/i.exec(attrs);
    const aria = /\baria-label\s*=\s*\{?["'`]([^"'`]+)["'`]\}?/i.exec(attrs);
    const actionMatch = /\baction\s*=\s*\{?["'`]([^"'`]+)["'`]\}?/i.exec(attrs);
    const base = slugify(aria?.[1] ?? idMatch?.[1] ?? actionMatch?.[1] ?? "form");
    const name = uniqueName(`submit_${base}`, used);

    // Collect name= on inputs after this form tag until </form> or next form
    const start = m.index + m[0].length;
    const end = content.indexOf("</form>", start);
    const body = end === -1 ? content.slice(start, start + 2000) : content.slice(start, end);
    const fields: FieldInfo[] = [];
    const nameRe = /\bname\s*=\s*\{?["'`]([^"'`]+)["'`]\}?/gi;
    let nm: RegExpExecArray | null;
    const seen = new Set<string>();
    while ((nm = nameRe.exec(body))) {
      const n = nm[1];
      if (!n || seen.has(n)) continue;
      seen.add(n);
      fields.push({
        name: slugify(n) || n,
        type: "string",
        required: /\brequired\b/i.test(body.slice(Math.max(0, nm.index - 80), nm.index + 80)),
        description: `Field "${n}"`,
      });
    }
    if (fields.length === 0 && !actionMatch && !idMatch) continue;
    tools.push({
      name,
      description: aria?.[1]
        ? `Submit form: ${aria[1]}`
        : `Submit form on ${relPath}`,
      inputSchema: fieldsToSchema(fields),
      safety: "write",
      requireConfirmation: false,
      source: { kind: "form", path: relPath },
      binding: {
        type: "form",
        selector: idMatch ? `#${idMatch[1]}` : undefined,
        action: actionMatch?.[1],
      },
      status: "draft",
    });
  }

  // "use server" actions export async function
  if (content.includes("use server")) {
    const fnRe = /export\s+async\s+function\s+([A-Za-z0-9_]+)\s*\(/g;
    let fm: RegExpExecArray | null;
    while ((fm = fnRe.exec(content))) {
      const fn = fm[1] ?? "action";
      const name = uniqueName(slugify(fn), used);
      tools.push({
        name,
        description: `Call server action ${fn} from ${relPath}`,
        inputSchema: {
          type: "object",
          properties: {
            payload: {
              type: "object",
              description: "Arguments for the server action",
              additionalProperties: true,
            },
          },
          required: ["payload"],
          additionalProperties: false,
        },
        safety: "write",
        requireConfirmation: true,
        source: { kind: "route", path: relPath },
        binding: { type: "custom" },
        status: "draft",
      });
    }
  }

  return tools;
}

function analyzeApiRoutes(content: string, relPath: string, used: Set<string>): HaliteTool[] {
  const tools: HaliteTool[] = [];
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
  for (const method of methods) {
    const re = new RegExp(
      `export\\s+(?:async\\s+)?function\\s+${method}\\s*\\(`,
      "g",
    );
    if (!re.test(content)) continue;
    const routeHint = relPath
      .replace(/\\/g, "/")
      .replace(/^.*?(app\/|pages\/|src\/)/, "")
      .replace(/\/route\.(ts|js|tsx|jsx)$/, "")
      .replace(/\/index\.(ts|js)$/, "")
      .replace(/\.(ts|js)$/, "");
    const base = slugify(`${method.toLowerCase()}_${routeHint}`) || `${method.toLowerCase()}_api`;
    const name = uniqueName(base, used);
    tools.push({
      name,
      description: `${method} ${routeHint || relPath}`,
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "object",
            description: "Query string parameters",
            additionalProperties: true,
          },
          body: {
            type: "object",
            description: "JSON request body",
            additionalProperties: true,
          },
        },
        additionalProperties: false,
      },
      safety: method === "GET" ? "read" : "write",
      requireConfirmation: method !== "GET",
      source: { kind: "api", path: relPath },
      binding: {
        type: "navigate",
        method,
        action: "/" + routeHint.replace(/^api\//, "api/"),
      },
      status: "draft",
    });
  }
  return tools;
}

/** Static analysis of a local repository. Does not run project code. */
export function analyzeRepository(options: AnalyzeOptions): HaliteTool[] {
  const root = resolve(options.root);
  if (!existsSync(root)) {
    throw new Error(`Path not found: ${root}`);
  }

  const patterns = options.include?.length ? options.include : DEFAULT_INCLUDE;
  const ignore = [...DEFAULT_EXCLUDE, ...(options.exclude ?? [])];
  const files = fg.sync(patterns, {
    cwd: root,
    ignore,
    absolute: true,
    onlyFiles: true,
  });

  // Also pick up Next/API route handlers
  const apiFiles = fg.sync(
    ["**/api/**/*.{ts,js}", "**/app/**/route.{ts,js,tsx,jsx}"],
    { cwd: root, ignore, absolute: true, onlyFiles: true },
  );

  const used = new Set<string>();
  const tools: HaliteTool[] = [];
  const seenPaths = new Set<string>();

  for (const file of [...files, ...apiFiles]) {
    if (seenPaths.has(file)) continue;
    seenPaths.add(file);
    const rel = relative(root, file).replace(/\\/g, "/");
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (/\.html?$/i.test(file)) {
      tools.push(...analyzeHtml(content, rel, used));
      // SPA / formless controls (buttons, selects, file, radios)
      tools.push(...toolsFromInventory(inventoryFromHtml(content, rel), used));
    } else if (/\.(jsx|tsx|vue|svelte|astro)$/i.test(file)) {
      tools.push(...analyzeJsx(content, rel, used));
    }
    if (/\/route\.(ts|js|tsx|jsx)$/i.test(file) || /\/api\//i.test(rel)) {
      tools.push(...analyzeApiRoutes(content, rel, used));
    }
  }

  return tools;
}

export function analyzePath(root: string): HaliteTool[] {
  return analyzeRepository({ root });
}
