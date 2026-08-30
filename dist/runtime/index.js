// src/runtime/index.ts
function getModelContext(doc = document) {
  const d = doc;
  const n = globalThis.navigator;
  return d.modelContext ?? n.modelContext ?? null;
}
function fillForm(form, args) {
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
    } else if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      el.value = String(value);
    }
  }
}
async function executeBinding(tool, args) {
  const binding = tool.binding;
  if (!binding) {
    return {
      ok: false,
      error: "No DOM binding. Implement execute in a custom loader or approve a form/button tool."
    };
  }
  if (tool.requireConfirmation || tool.safety === "danger") {
    const ok = window.confirm(
      `Allow agent to run "${tool.name}"?
${tool.description}`
    );
    if (!ok) return { ok: false, error: "User declined confirmation" };
  }
  if (binding.type === "form") {
    let form = null;
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
      for (const [k, v] of Object.entries(args.query)) {
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
      body: args.body ? JSON.stringify(args.body) : void 0
    });
    const text = await res.text();
    let data = text;
    try {
      data = JSON.parse(text);
    } catch {
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
        `input[type="radio"][name="${CSS.escape(binding.name)}"][value="${String(value).replace(/"/g, '\\"')}"]`
      );
      if (!(radio instanceof HTMLInputElement)) {
        return {
          ok: false,
          error: `Radio ${binding.name}=${String(value)} not found`
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
    const name = fileUrl.split("/").filter(Boolean).at(-1)?.split("?")[0] || "upload.bin";
    const file = new File([blob], name, {
      type: blob.type || "application/octet-stream"
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
    error: "Custom binding requires a page-provided execute handler"
  };
}
async function registerManifest(manifest, options = {}) {
  const ctx = getModelContext();
  if (!ctx) {
    throw new Error(
      "WebMCP is not available. Use Chrome 146+ with chrome://flags/#enable-webmcp-testing enabled."
    );
  }
  const approvedOnly = options.approvedOnly !== false;
  const registered = [];
  for (const tool of manifest.tools) {
    if (approvedOnly && tool.status !== "approved") continue;
    const execute = options.executors?.[tool.name] ?? ((args) => executeBinding(tool, args));
    try {
      await ctx.registerTool(
        {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: {
            readOnlyHint: tool.safety === "read",
            destructiveHint: tool.safety === "danger"
          },
          execute: async (args) => execute(args ?? {})
        },
        { signal: options.signal }
      );
      registered.push(tool.name);
      options.onRegistered?.(tool.name);
    } catch (err) {
      options.onError?.(tool.name, err);
    }
  }
  return registered;
}
function emitScriptTag(manifestUrl) {
  return `<script src="halite.runtime.js" data-halite-manifest="${manifestUrl}" defer></script>`;
}
export {
  emitScriptTag,
  getModelContext,
  registerManifest
};
//# sourceMappingURL=index.js.map