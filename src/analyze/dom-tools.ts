import type { HaliteTool } from "../schema/manifest.js";

export type DomControl = {
  kind: "button" | "select" | "radio-group" | "file" | "checkbox" | "text";
  selector: string;
  label: string;
  name?: string;
  id?: string;
  options?: string[];
  accept?: string;
  inputType?: string;
};

export type DomInventory = {
  path?: string;
  url?: string;
  controls: DomControl[];
};

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

const NOISE_BUTTON =
  /^(menu|close|open|toggle|next|prev|previous|ok|cancel|dismiss|cookie|accept all|reject all)$/i;

/** Turn a DOM control inventory into draft Halite tools. */
export function toolsFromInventory(
  inventory: DomInventory,
  used: Set<string> = new Set(),
): HaliteTool[] {
  const tools: HaliteTool[] = [];
  const path = inventory.path ?? inventory.url ?? "dom";
  const radiosDone = new Set<string>();

  for (const control of inventory.controls) {
    if (control.kind === "button") {
      const label = control.label.trim();
      if (!label || label.length > 80) continue;
      if (NOISE_BUTTON.test(label)) continue;
      const base = uniqueName(slugify(`click_${label}`), used);
      const safety =
        /delete|remove|destroy|wipe|reset/i.test(label) ? "danger" : "write";
      const readHint = /download|export|copy|share|view|preview|open/i.test(label);
      tools.push({
        name: base,
        description: `${label} on the page`,
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        safety: readHint && safety !== "danger" ? "read" : safety,
        requireConfirmation: safety === "danger",
        source: { kind: "button", path, selector: control.selector },
        binding: { type: "click", selector: control.selector },
        status: "draft",
      });
      continue;
    }

    if (control.kind === "file") {
      const label = control.label.trim() || "image";
      const name = uniqueName(slugify(`upload_${label}`), used);
      tools.push({
        name,
        description: `Upload a file into ${label}`,
        inputSchema: {
          type: "object",
          properties: {
            fileUrl: {
              type: "string",
              description: "http(s) URL of the file to upload into the input",
            },
          },
          required: ["fileUrl"],
          additionalProperties: false,
        },
        safety: "write",
        requireConfirmation: false,
        source: { kind: "html", path, selector: control.selector },
        binding: {
          type: "upload",
          selector: control.selector,
          accept: control.accept,
        },
        status: "draft",
      });
      continue;
    }

    if (control.kind === "select") {
      const label = control.label.trim() || control.id || control.name || "option";
      const name = uniqueName(slugify(`set_${label}`), used);
      const props: Record<string, unknown> = {
        value: {
          type: "string",
          description: control.options?.length
            ? `One of: ${control.options.slice(0, 20).join(", ")}`
            : `Value for ${label}`,
        },
      };
      if (control.options?.length) {
        (props.value as { enum?: string[] }).enum = control.options.slice(0, 50);
      }
      tools.push({
        name,
        description: `Set ${label}`,
        inputSchema: {
          type: "object",
          properties: props,
          required: ["value"],
          additionalProperties: false,
        },
        safety: "write",
        requireConfirmation: false,
        source: { kind: "html", path, selector: control.selector },
        binding: { type: "set", selector: control.selector, valueKey: "value" },
        status: "draft",
      });
      continue;
    }

    if (control.kind === "radio-group") {
      const key = control.name || control.selector;
      if (radiosDone.has(key)) continue;
      radiosDone.add(key);
      const label = control.label.trim() || control.name || "choice";
      const name = uniqueName(slugify(`set_${label}`), used);
      const props: Record<string, unknown> = {
        value: {
          type: "string",
          description: control.options?.length
            ? `One of: ${control.options.join(", ")}`
            : `Value for ${label}`,
        },
      };
      if (control.options?.length) {
        (props.value as { enum?: string[] }).enum = control.options;
      }
      tools.push({
        name,
        description: `Choose ${label}`,
        inputSchema: {
          type: "object",
          properties: props,
          required: ["value"],
          additionalProperties: false,
        },
        safety: "write",
        requireConfirmation: false,
        source: { kind: "html", path, selector: control.selector },
        binding: {
          type: "set",
          selector: control.selector,
          valueKey: "value",
          name: control.name,
        },
        status: "draft",
      });
      continue;
    }

    if (control.kind === "text" || control.kind === "checkbox") {
      const label = control.label.trim() || control.name || control.id || "field";
      const name = uniqueName(slugify(`set_${label}`), used);
      tools.push({
        name,
        description: `Set ${label}`,
        inputSchema: {
          type: "object",
          properties: {
            value: {
              type: control.kind === "checkbox" ? "boolean" : "string",
              description: `New value for ${label}`,
            },
          },
          required: ["value"],
          additionalProperties: false,
        },
        safety: "write",
        requireConfirmation: false,
        source: { kind: "html", path, selector: control.selector },
        binding: { type: "set", selector: control.selector, valueKey: "value" },
        status: "draft",
      });
    }
  }

  return tools;
}

/** Build a CSS selector that prefers id, then name, then ordinal tag. */
export function preferSelector(el: {
  tag: string;
  id?: string;
  name?: string;
  type?: string;
  index?: number;
}): string {
  if (el.id) return `#${cssEscape(el.id)}`;
  if (el.name && el.tag === "input" && el.type === "radio") {
    return `input[type="radio"][name="${cssEscape(el.name)}"]`;
  }
  if (el.name) return `${el.tag}[name="${cssEscape(el.name)}"]`;
  if (el.type) return `${el.tag}[type="${cssEscape(el.type)}"]`;
  return el.index != null ? `${el.tag}:nth-of-type(${el.index})` : el.tag;
}

function cssEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
