import type { HaliteManifest, HaliteTool } from "../schema/manifest.js";

export type ModelContextLike = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
      annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

export function getModelContext(
  doc: Document = document,
): ModelContextLike | null {
  const d = doc as Document & { modelContext?: ModelContextLike };
  const n = globalThis.navigator as Navigator & {
    modelContext?: ModelContextLike;
  };
  return d.modelContext ?? n.modelContext ?? null;
}

function fillForm(form: HTMLFormElement, args: Record<string, unknown>) {
  for (const [key, value] of Object.entries(args)) {
    const el = form.elements.namedItem(key);
    if (!el) continue;
    if (el instanceof RadioNodeList) {
      el.value = String(value);
      continue;
    }
    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox") {
        el.checked = Boolean(value);
      } else {
        el.value = String(value);
      }
    } else if (
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    ) {
      el.value = String(value);
    }
  }
}

async function executeBinding(
  tool: HaliteTool,
  args: Record<string, unknown>,
): Promise<unknown> {
  const binding = tool.binding;
  if (!binding) {
    return {
      ok: false,
      error:
        "No DOM binding. Implement execute in a custom loader or approve a form/button tool.",
    };
  }

  if (tool.requireConfirmation || tool.safety === "danger") {
    const ok = window.confirm(
      `Allow agent to run "${tool.name}"?\n${tool.description}`,
    );
    if (!ok) return { ok: false, error: "User declined confirmation" };
  }

  if (binding.type === "form") {
    let form: HTMLFormElement | null = null;
    if (binding.selector) {
      form = document.querySelector(binding.selector);
    }
    if (!form) {
      form = document.querySelector("form");
    }
    if (!form) {
      return { ok: false, error: "Form not found on page" };
    }
    fillForm(form, args);
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
    } else {
      form.submit();
    }
    return { ok: true, action: "form_submit", name: tool.name, args };
  }

  if (binding.type === "click") {
    if (!binding.selector) {
      return { ok: false, error: "Click binding missing selector" };
    }
    const el = document.querySelector(binding.selector);
    if (!(el instanceof HTMLElement)) {
      return { ok: false, error: `Element not found: ${binding.selector}` };
    }
    el.click();
    return { ok: true, action: "click", selector: binding.selector };
  }

  if (binding.type === "navigate") {
    const url = new URL(binding.action ?? "/", window.location.origin);
    if (args.query && typeof args.query === "object") {
      for (const [k, v] of Object.entries(args.query as Record<string, unknown>)) {
        url.searchParams.set(k, String(v));
      }
    }
    if (binding.method === "GET" || !binding.method) {
      window.location.assign(url.toString());
      return { ok: true, action: "navigate", url: url.toString() };
    }
    const res = await fetch(url.toString(), {
      method: binding.method,
      headers: { "content-type": "application/json" },
      body: args.body ? JSON.stringify(args.body) : undefined,
    });
    const text = await res.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      /* keep text */
    }
    return { ok: res.ok, status: res.status, data };
  }

  if (binding.type === "set") {
    if (!binding.selector) {
      return { ok: false, error: "Set binding missing selector" };
    }
    const key = binding.valueKey ?? "value";
    const value = args[key];
    if (binding.name) {
      const radio = document.querySelector(
        `input[type="radio"][name="${CSS.escape(binding.name)}"][value="${String(value).replace(/"/g, '\\"')}"]`,
      );
      if (!(radio instanceof HTMLInputElement)) {
        return {
          ok: false,
          error: `Radio ${binding.name}=${String(value)} not found`,
        };
      }
      radio.click();
      radio.dispatchEvent(new Event("input", { bubbles: true }));
      radio.dispatchEvent(new Event("change", { bubbles: true }));
      return { ok: true, action: "set_radio", name: binding.name, value };
    }
    const el = document.querySelector(binding.selector);
    if (!(el instanceof HTMLElement)) {
      return { ok: false, error: `Element not found: ${binding.selector}` };
    }
    if (el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
      el.value = String(value ?? "");
    } else if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox") {
        el.checked = Boolean(value);
      } else {
        el.value = String(value ?? "");
      }
    } else {
      return { ok: false, error: "Element cannot accept a value" };
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return { ok: true, action: "set", selector: binding.selector, value };
  }

  if (binding.type === "upload") {
    if (!binding.selector) {
      return { ok: false, error: "Upload binding missing selector" };
    }
    const fileUrl = String(args.fileUrl ?? "");
    if (!fileUrl) {
      return { ok: false, error: "fileUrl is required" };
    }
    const el = document.querySelector(binding.selector);
    if (!(el instanceof HTMLInputElement) || el.type !== "file") {
      return { ok: false, error: `File input not found: ${binding.selector}` };
    }
    const res = await fetch(fileUrl);
    if (!res.ok) {
      return { ok: false, error: `Failed to fetch fileUrl: ${res.status}` };
    }
    const blob = await res.blob();
    const name =
      fileUrl.split("/").filter(Boolean).at(-1)?.split("?")[0] || "upload.bin";
    const file = new File([blob], name, {
      type: blob.type || "application/octet-stream",
    });
    const dt = new DataTransfer();
    dt.items.add(file);
    el.files = dt.files;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return { ok: true, action: "upload", selector: binding.selector, name };
  }

  return {
    ok: false,
    error: "Custom binding requires a page-provided execute handler",
  };
}

export type RegisterOptions = {
  /** Only register approved tools. Default true. */
  approvedOnly?: boolean;
  signal?: AbortSignal;
  /** Override execute for a tool name. */
  executors?: Record<
    string,
    (args: Record<string, unknown>) => Promise<unknown> | unknown
  >;
  onRegistered?: (name: string) => void;
  onError?: (name: string, error: unknown) => void;
};

/** Register Halite tools with the browser WebMCP modelContext API. */
export async function registerManifest(
  manifest: HaliteManifest,
  options: RegisterOptions = {},
): Promise<string[]> {
  const ctx = getModelContext();
  if (!ctx) {
    throw new Error(
      "WebMCP is not available. Use Chrome 146+ with chrome://flags/#enable-webmcp-testing enabled.",
    );
  }

  const approvedOnly = options.approvedOnly !== false;
  const registered: string[] = [];

  for (const tool of manifest.tools) {
    if (approvedOnly && tool.status !== "approved") continue;

    const execute =
      options.executors?.[tool.name] ??
      ((args: Record<string, unknown>) => executeBinding(tool, args));

    try {
      await ctx.registerTool(
        {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema as Record<string, unknown>,
          annotations: {
            readOnlyHint: tool.safety === "read",
            destructiveHint: tool.safety === "danger",
          },
          execute: async (args) => execute(args ?? {}),
        },
        { signal: options.signal },
      );
      registered.push(tool.name);
      options.onRegistered?.(tool.name);
    } catch (err) {
      options.onError?.(tool.name, err);
    }
  }

  return registered;
}

export function emitScriptTag(manifestUrl: string): string {
  return `<script src="halite.runtime.js" data-halite-manifest="${manifestUrl}" defer></script>`;
}
