// src/analyze/index.ts
import { readFileSync, existsSync as existsSync2 } from "fs";
import { relative, resolve } from "path";
import fg from "fast-glob";

// src/analyze/html-controls.ts
function attr(attrs, name) {
  const m = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(attrs);
  return m?.[1];
}
function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function inventoryFromHtml(content, path = "page.html") {
  const controls = [];
  const radioGroups = /* @__PURE__ */ new Map();
  const btnRe = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let bm;
  let buttonIndex = 0;
  while (bm = btnRe.exec(content)) {
    buttonIndex += 1;
    const attrs = bm[1] ?? "";
    if (/\bdata-(?:halite|webmcp)-tool\s*=/i.test(attrs)) continue;
    const type = (attr(attrs, "type") ?? "submit").toLowerCase();
    if (type === "submit") {
    }
    const id = attr(attrs, "id");
    const aria = attr(attrs, "aria-label");
    const text = stripTags(bm[2] ?? "");
    const label = aria || text;
    if (!label) continue;
    const disabled = /\bdisabled\b/i.test(attrs);
    if (disabled) continue;
    controls.push({
      kind: "button",
      selector: id ? `#${id}` : `button:nth-of-type(${buttonIndex})`,
      label,
      id
    });
  }
  const selectRe = /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;
  let sm;
  while (sm = selectRe.exec(content)) {
    const attrs = sm[1] ?? "";
    const body = sm[2] ?? "";
    const id = attr(attrs, "id");
    const name = attr(attrs, "name");
    const aria = attr(attrs, "aria-label");
    const options = [...body.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)].map(
      (om) => {
        const oattrs = om[1] ?? "";
        const value = attr(oattrs, "value");
        const text = stripTags(om[2] ?? "");
        return value || text;
      }
    ).filter(Boolean);
    const label = aria || id || name || "select";
    controls.push({
      kind: "select",
      selector: id ? `#${id}` : name ? `select[name="${name}"]` : "select",
      label,
      id,
      name,
      options
    });
  }
  const inputRe = /<input\b([^>]*)\/?>/gi;
  let im;
  let fileIndex = 0;
  while (im = inputRe.exec(content)) {
    const attrs = im[1] ?? "";
    const type = (attr(attrs, "type") ?? "text").toLowerCase();
    const id = attr(attrs, "id");
    const name = attr(attrs, "name");
    const aria = attr(attrs, "aria-label");
    const accept = attr(attrs, "accept");
    if (type === "file") {
      fileIndex += 1;
      const start = Math.max(0, im.index - 400);
      const before = content.slice(start, im.index);
      const labelMatch = /<label\b[^>]*>([\s\S]*?)$/i.exec(before) || />([^<>]{0,80})$/.exec(before.replace(/<[^>]+>/g, ">"));
      const nearby = labelMatch ? stripTags(labelMatch[1] ?? "").replace(/\s*Choose image\s*/i, "image") : "";
      controls.push({
        kind: "file",
        selector: id ? `#${id}` : `input[type="file"]:nth-of-type(${fileIndex})`,
        label: aria || nearby || "file",
        id,
        name,
        accept,
        inputType: type
      });
      continue;
    }
    if (type === "radio") {
      if (!name) continue;
      const value = attr(attrs, "value") ?? "";
      const existing = radioGroups.get(name);
      if (existing) {
        if (value && !existing.options?.includes(value)) {
          existing.options = [...existing.options ?? [], value];
        }
      } else {
        radioGroups.set(name, {
          kind: "radio-group",
          selector: `input[type="radio"][name="${name}"]`,
          label: aria || name,
          name,
          options: value ? [value] : [],
          inputType: type
        });
      }
      continue;
    }
    if (type === "hidden" || type === "submit" || type === "button" || type === "reset" || type === "image") {
      continue;
    }
    if (type === "checkbox") {
      controls.push({
        kind: "checkbox",
        selector: id ? `#${id}` : name ? `input[name="${name}"]` : `input[type="checkbox"]`,
        label: aria || name || id || "checkbox",
        id,
        name,
        inputType: type
      });
      continue;
    }
    if (id || name || aria) {
      controls.push({
        kind: "text",
        selector: id ? `#${id}` : name ? `input[name="${name}"]` : `input[type="${type}"]`,
        label: aria || name || id || type,
        id,
        name,
        inputType: type
      });
    }
  }
  controls.push(...radioGroups.values());
  return { path, controls };
}

// src/analyze/dom-tools.ts
function slugify(raw) {
  const s = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/_+/g, "_");
  if (!s) return "action";
  if (/^[0-9]/.test(s)) return `tool_${s}`;
  return s.slice(0, 48);
}
function uniqueName(base, used) {
  let name = base;
  let i = 2;
  while (used.has(name)) {
    name = `${base}_${i}`;
    i += 1;
  }
  used.add(name);
  return name;
}
var NOISE_BUTTON = /^(menu|close|open|toggle|next|prev|previous|ok|cancel|dismiss|cookie|accept all|reject all)$/i;
function toolsFromInventory(inventory, used = /* @__PURE__ */ new Set()) {
  const tools = [];
  const path = inventory.path ?? inventory.url ?? "dom";
  const radiosDone = /* @__PURE__ */ new Set();
  for (const control of inventory.controls) {
    if (control.kind === "button") {
      const label = control.label.trim();
      if (!label || label.length > 80) continue;
      if (NOISE_BUTTON.test(label)) continue;
      const base = uniqueName(slugify(`click_${label}`), used);
      const safety = /delete|remove|destroy|wipe|reset/i.test(label) ? "danger" : "write";
      const readHint = /download|export|copy|share|view|preview|open/i.test(label);
      tools.push({
        name: base,
        description: `${label} on the page`,
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        safety: readHint && safety !== "danger" ? "read" : safety,
        requireConfirmation: safety === "danger",
        source: { kind: "button", path, selector: control.selector },
        binding: { type: "click", selector: control.selector },
        status: "draft"
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
              description: "http(s) URL of the file to upload into the input"
            }
          },
          required: ["fileUrl"],
          additionalProperties: false
        },
        safety: "write",
        requireConfirmation: false,
        source: { kind: "html", path, selector: control.selector },
        binding: {
          type: "upload",
          selector: control.selector,
          accept: control.accept
        },
        status: "draft"
      });
      continue;
    }
    if (control.kind === "select") {
      const label = control.label.trim() || control.id || control.name || "option";
      const name = uniqueName(slugify(`set_${label}`), used);
      const props = {
        value: {
          type: "string",
          description: control.options?.length ? `One of: ${control.options.slice(0, 20).join(", ")}` : `Value for ${label}`
        }
      };
      if (control.options?.length) {
        props.value.enum = control.options.slice(0, 50);
      }
      tools.push({
        name,
        description: `Set ${label}`,
        inputSchema: {
          type: "object",
          properties: props,
          required: ["value"],
          additionalProperties: false
        },
        safety: "write",
        requireConfirmation: false,
        source: { kind: "html", path, selector: control.selector },
        binding: { type: "set", selector: control.selector, valueKey: "value" },
        status: "draft"
      });
      continue;
    }
    if (control.kind === "radio-group") {
      const key = control.name || control.selector;
      if (radiosDone.has(key)) continue;
      radiosDone.add(key);
      const label = control.label.trim() || control.name || "choice";
      const name = uniqueName(slugify(`set_${label}`), used);
      const props = {
        value: {
          type: "string",
          description: control.options?.length ? `One of: ${control.options.join(", ")}` : `Value for ${label}`
        }
      };
      if (control.options?.length) {
        props.value.enum = control.options;
      }
      tools.push({
        name,
        description: `Choose ${label}`,
        inputSchema: {
          type: "object",
          properties: props,
          required: ["value"],
          additionalProperties: false
        },
        safety: "write",
        requireConfirmation: false,
        source: { kind: "html", path, selector: control.selector },
        binding: {
          type: "set",
          selector: control.selector,
          valueKey: "value",
          name: control.name
        },
        status: "draft"
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
              description: `New value for ${label}`
            }
          },
          required: ["value"],
          additionalProperties: false
        },
        safety: "write",
        requireConfirmation: false,
        source: { kind: "html", path, selector: control.selector },
        binding: { type: "set", selector: control.selector, valueKey: "value" },
        status: "draft"
      });
    }
  }
  return tools;
}

// src/analyze/url.ts
import { mkdtempSync, writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
async function loadPlaywright() {
  try {
    return await import("playwright-core");
  } catch {
    throw new Error(
      "Live URL analysis requires playwright-core. Run: pnpm add playwright-core"
    );
  }
}
function resolveChrome(explicit) {
  if (explicit && existsSync(explicit)) return explicit;
  const candidates = [
    process.env.CHROME_PATH,
    process.env.HALITE_CHROME,
    "/usr/local/bin/google-chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ].filter(Boolean);
  return candidates.find((p) => p && existsSync(p));
}
function resolveBrowserPath(pw, explicit) {
  const system = resolveChrome(explicit);
  if (system) return system;
  try {
    const fromPw = pw.chromium.executablePath?.();
    if (fromPw && existsSync(fromPw)) return fromPw;
  } catch {
  }
  return void 0;
}
function tinyPngPath() {
  const dir = mkdtempSync(join(tmpdir(), "halite-probe-"));
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  const path = join(dir, "probe.png");
  writeFileSync(path, png);
  return path;
}
function collectInventoryScript() {
  const cssEscape = window.CSS?.escape ? (s) => window.CSS.escape(s) : (s) => s.replace(/"/g, '\\"');
  const controls = [];
  const buttons = [...document.querySelectorAll("button")];
  buttons.forEach((b, i) => {
    if (b.disabled) return;
    const label = b.getAttribute("aria-label") || (b.textContent || "").replace(/\s+/g, " ").trim();
    if (!label) return;
    const selector = b.id ? `#${cssEscape(b.id)}` : `button:nth-of-type(${i + 1})`;
    controls.push({ kind: "button", selector, label, id: b.id || void 0 });
  });
  for (const sel of [...document.querySelectorAll("select")]) {
    const options = [...sel.options].map((o) => o.value || o.text).filter(Boolean);
    const label = sel.getAttribute("aria-label") || sel.id || sel.name || "select";
    const selector = sel.id ? `#${cssEscape(sel.id)}` : sel.name ? `select[name="${cssEscape(sel.name)}"]` : "select";
    controls.push({
      kind: "select",
      selector,
      label,
      id: sel.id || void 0,
      name: sel.name || void 0,
      options
    });
  }
  const radioNames = /* @__PURE__ */ new Set();
  for (const input of [...document.querySelectorAll("input")]) {
    const type = (input.type || "text").toLowerCase();
    if (type === "file") {
      const labelEl = input.closest("label") || document.querySelector(`label[for="${input.id}"]`);
      const label = input.getAttribute("aria-label") || (labelEl?.textContent || "").replace(/\s+/g, " ").trim() || "file";
      const selector = input.id ? `#${cssEscape(input.id)}` : 'input[type="file"]';
      controls.push({
        kind: "file",
        selector,
        label,
        id: input.id || void 0,
        name: input.name || void 0,
        accept: input.accept || void 0,
        inputType: type
      });
      continue;
    }
    if (type === "radio") {
      if (!input.name || radioNames.has(input.name)) continue;
      radioNames.add(input.name);
      const group = [
        ...document.querySelectorAll(`input[type="radio"][name="${cssEscape(input.name)}"]`)
      ];
      controls.push({
        kind: "radio-group",
        selector: `input[type="radio"][name="${cssEscape(input.name)}"]`,
        label: input.name,
        name: input.name,
        options: group.map((g) => g.value).filter(Boolean),
        inputType: type
      });
      continue;
    }
    if (["hidden", "submit", "button", "reset", "image"].includes(type)) continue;
    if (type === "checkbox") {
      controls.push({
        kind: "checkbox",
        selector: input.id ? `#${cssEscape(input.id)}` : input.name ? `input[name="${cssEscape(input.name)}"]` : 'input[type="checkbox"]',
        label: input.getAttribute("aria-label") || input.name || input.id || "checkbox",
        id: input.id || void 0,
        name: input.name || void 0,
        inputType: type
      });
      continue;
    }
    if (input.id || input.name || input.getAttribute("aria-label")) {
      controls.push({
        kind: "text",
        selector: input.id ? `#${cssEscape(input.id)}` : input.name ? `input[name="${cssEscape(input.name)}"]` : `input[type="${type}"]`,
        label: input.getAttribute("aria-label") || input.name || input.id || type,
        id: input.id || void 0,
        name: input.name || void 0,
        inputType: type
      });
    }
  }
  return { url: location.href, controls };
}
async function analyzeUrl(options) {
  const pw = await loadPlaywright();
  const executablePath = resolveBrowserPath(pw, options.executablePath);
  const browser = await pw.chromium.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-gpu"]
  });
  try {
    const page = await browser.newPage();
    await page.goto(options.url, {
      waitUntil: "networkidle",
      timeout: options.timeoutMs ?? 6e4
    });
    await page.waitForTimeout(800);
    if (options.probe !== false) {
      const files = page.locator('input[type="file"]');
      const count = await files.count();
      if (count > 0) {
        await files.first().setInputFiles(tinyPngPath());
        await page.waitForTimeout(1500);
      }
    }
    const inventory = await page.evaluate(collectInventoryScript);
    inventory.url = options.url;
    const tools = toolsFromInventory(inventory);
    return { tools, inventory };
  } finally {
    await browser.close();
  }
}

// src/analyze/index.ts
var DEFAULT_INCLUDE = [
  "**/*.html",
  "**/*.htm",
  "**/*.jsx",
  "**/*.tsx",
  "**/*.vue",
  "**/*.svelte",
  "**/*.astro"
];
var DEFAULT_EXCLUDE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.git/**",
  "**/coverage/**",
  "**/.next/**"
];
function slugify2(raw) {
  const s = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/_+/g, "_");
  if (!s) return "action";
  if (/^[0-9]/.test(s)) return `tool_${s}`;
  return s.slice(0, 48);
}
function uniqueName2(base, used) {
  let name = base;
  let i = 2;
  while (used.has(name)) {
    name = `${base}_${i}`;
    i += 1;
  }
  used.add(name);
  return name;
}
function fieldsToSchema(fields) {
  const properties = {};
  const required = [];
  for (const f of fields) {
    properties[f.name] = {
      type: f.type,
      description: f.description
    };
    if (f.required) required.push(f.name);
  }
  return {
    type: "object",
    properties,
    required: required.length ? required : void 0,
    additionalProperties: false
  };
}
function extractFormFields(formHtml) {
  const fields = [];
  const inputRe = /<(input|textarea|select)\b([^>]*)>/gi;
  let m;
  while (m = inputRe.exec(formHtml)) {
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
      name: slugify2(name).replace(/^tool_/, "") || name,
      type: jsonType,
      required,
      description: `${tag} field "${name}" (${inputType})`
    });
  }
  return fields;
}
function analyzeHtml(content, relPath, used) {
  const tools = [];
  const declarativeRe = /<form\b([^>]*\btoolname\s*=\s*["']([^"']+)["'][^>]*)>([\s\S]*?)<\/form>/gi;
  let dm;
  while (dm = declarativeRe.exec(content)) {
    const attrs = dm[1] ?? "";
    const toolName = uniqueName2(slugify2(dm[2] ?? "form"), used);
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
        method: methodMatch?.[1]?.toUpperCase() || "POST"
      },
      status: "draft"
    });
  }
  const formRe = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  let fm;
  while (fm = formRe.exec(content)) {
    const attrs = fm[1] ?? "";
    if (/\btoolname\s*=/i.test(attrs)) continue;
    const body = fm[2] ?? "";
    const idMatch = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const nameAttr = /\bname\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const actionMatch = /\baction\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const methodMatch = /\bmethod\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const aria = /\baria-label\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const base = slugify2(aria?.[1] ?? nameAttr?.[1] ?? idMatch?.[1] ?? actionMatch?.[1] ?? "submit_form") || "submit_form";
    const name = uniqueName2(base.startsWith("submit") ? base : `submit_${base}`, used);
    const fields = extractFormFields(body);
    if (fields.length === 0 && !actionMatch) continue;
    tools.push({
      name,
      description: aria?.[1] ? `Submit form: ${aria[1]}` : `Submit the ${name.replace(/^submit_/, "")} form on ${relPath}`,
      inputSchema: fieldsToSchema(fields),
      safety: "write",
      requireConfirmation: false,
      source: { kind: "form", path: relPath },
      binding: {
        type: "form",
        selector: idMatch ? `#${idMatch[1]}` : nameAttr ? `form[name="${nameAttr[1]}"]` : void 0,
        action: actionMatch?.[1],
        method: methodMatch?.[1]?.toUpperCase() || "GET"
      },
      status: "draft"
    });
  }
  const btnRe = /<button\b([^>]*\b(?:data-halite-tool|data-webmcp-tool)\s*=\s*["']([^"']+)["'][^>]*)>([\s\S]*?)<\/button>/gi;
  let bm;
  while (bm = btnRe.exec(content)) {
    const attrs = bm[1] ?? "";
    const toolName = uniqueName2(slugify2(bm[2] ?? "click"), used);
    const descMatch = /\bdata-(?:halite|webmcp)-description\s*=\s*["']([^"']+)["']/i.exec(attrs);
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
        selector: idMatch ? `#${idMatch[1]}` : `button[data-halite-tool="${bm[2]}"],button[data-webmcp-tool="${bm[2]}"]`
      },
      status: "draft"
    });
  }
  return tools;
}
function analyzeJsx(content, relPath, used) {
  const tools = [];
  const formJsxRe = /<form\b([^>]*)>/gi;
  let m;
  while (m = formJsxRe.exec(content)) {
    const attrs = m[1] ?? "";
    const idMatch = /\bid\s*=\s*\{?["'`]([^"'`]+)["'`]\}?/i.exec(attrs);
    const aria = /\baria-label\s*=\s*\{?["'`]([^"'`]+)["'`]\}?/i.exec(attrs);
    const actionMatch = /\baction\s*=\s*\{?["'`]([^"'`]+)["'`]\}?/i.exec(attrs);
    const base = slugify2(aria?.[1] ?? idMatch?.[1] ?? actionMatch?.[1] ?? "form");
    const name = uniqueName2(`submit_${base}`, used);
    const start = m.index + m[0].length;
    const end = content.indexOf("</form>", start);
    const body = end === -1 ? content.slice(start, start + 2e3) : content.slice(start, end);
    const fields = [];
    const nameRe = /\bname\s*=\s*\{?["'`]([^"'`]+)["'`]\}?/gi;
    let nm;
    const seen = /* @__PURE__ */ new Set();
    while (nm = nameRe.exec(body)) {
      const n = nm[1];
      if (!n || seen.has(n)) continue;
      seen.add(n);
      fields.push({
        name: slugify2(n) || n,
        type: "string",
        required: /\brequired\b/i.test(body.slice(Math.max(0, nm.index - 80), nm.index + 80)),
        description: `Field "${n}"`
      });
    }
    if (fields.length === 0 && !actionMatch && !idMatch) continue;
    tools.push({
      name,
      description: aria?.[1] ? `Submit form: ${aria[1]}` : `Submit form on ${relPath}`,
      inputSchema: fieldsToSchema(fields),
      safety: "write",
      requireConfirmation: false,
      source: { kind: "form", path: relPath },
      binding: {
        type: "form",
        selector: idMatch ? `#${idMatch[1]}` : void 0,
        action: actionMatch?.[1]
      },
      status: "draft"
    });
  }
  if (content.includes("use server")) {
    const fnRe = /export\s+async\s+function\s+([A-Za-z0-9_]+)\s*\(/g;
    let fm;
    while (fm = fnRe.exec(content)) {
      const fn = fm[1] ?? "action";
      const name = uniqueName2(slugify2(fn), used);
      tools.push({
        name,
        description: `Call server action ${fn} from ${relPath}`,
        inputSchema: {
          type: "object",
          properties: {
            payload: {
              type: "object",
              description: "Arguments for the server action",
              additionalProperties: true
            }
          },
          required: ["payload"],
          additionalProperties: false
        },
        safety: "write",
        requireConfirmation: true,
        source: { kind: "route", path: relPath },
        binding: { type: "custom" },
        status: "draft"
      });
    }
  }
  return tools;
}
function analyzeApiRoutes(content, relPath, used) {
  const tools = [];
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  for (const method of methods) {
    const re = new RegExp(
      `export\\s+(?:async\\s+)?function\\s+${method}\\s*\\(`,
      "g"
    );
    if (!re.test(content)) continue;
    const routeHint = relPath.replace(/\\/g, "/").replace(/^.*?(app\/|pages\/|src\/)/, "").replace(/\/route\.(ts|js|tsx|jsx)$/, "").replace(/\/index\.(ts|js)$/, "").replace(/\.(ts|js)$/, "");
    const base = slugify2(`${method.toLowerCase()}_${routeHint}`) || `${method.toLowerCase()}_api`;
    const name = uniqueName2(base, used);
    tools.push({
      name,
      description: `${method} ${routeHint || relPath}`,
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "object",
            description: "Query string parameters",
            additionalProperties: true
          },
          body: {
            type: "object",
            description: "JSON request body",
            additionalProperties: true
          }
        },
        additionalProperties: false
      },
      safety: method === "GET" ? "read" : "write",
      requireConfirmation: method !== "GET",
      source: { kind: "api", path: relPath },
      binding: {
        type: "navigate",
        method,
        action: "/" + routeHint.replace(/^api\//, "api/")
      },
      status: "draft"
    });
  }
  return tools;
}
function analyzeRepository(options) {
  const root = resolve(options.root);
  if (!existsSync2(root)) {
    throw new Error(`Path not found: ${root}`);
  }
  const patterns = options.include?.length ? options.include : DEFAULT_INCLUDE;
  const ignore = [...DEFAULT_EXCLUDE, ...options.exclude ?? []];
  const files = fg.sync(patterns, {
    cwd: root,
    ignore,
    absolute: true,
    onlyFiles: true
  });
  const apiFiles = fg.sync(
    ["**/api/**/*.{ts,js}", "**/app/**/route.{ts,js,tsx,jsx}"],
    { cwd: root, ignore, absolute: true, onlyFiles: true }
  );
  const used = /* @__PURE__ */ new Set();
  const tools = [];
  const seenPaths = /* @__PURE__ */ new Set();
  for (const file of [...files, ...apiFiles]) {
    if (seenPaths.has(file)) continue;
    seenPaths.add(file);
    const rel = relative(root, file).replace(/\\/g, "/");
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (/\.html?$/i.test(file)) {
      tools.push(...analyzeHtml(content, rel, used));
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
function analyzePath(root) {
  return analyzeRepository({ root });
}
export {
  analyzePath,
  analyzeRepository,
  analyzeUrl,
  inventoryFromHtml,
  toolsFromInventory
};
//# sourceMappingURL=index.js.map