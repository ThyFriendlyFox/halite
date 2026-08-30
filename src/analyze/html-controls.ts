import type { DomControl, DomInventory } from "./dom-tools.js";

function attr(attrs: string, name: string): string | undefined {
  const m = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(attrs);
  return m?.[1];
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Heuristic HTML control inventory for SPA pages without <form>.
 * Complements form-based analysis in analyzeHtml.
 */
export function inventoryFromHtml(content: string, path = "page.html"): DomInventory {
  const controls: DomControl[] = [];
  const radioGroups = new Map<string, DomControl>();

  // buttons
  const btnRe = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let bm: RegExpExecArray | null;
  let buttonIndex = 0;
  while ((bm = btnRe.exec(content))) {
    buttonIndex += 1;
    const attrs = bm[1] ?? "";
    if (/\bdata-(?:halite|webmcp)-tool\s*=/i.test(attrs)) continue; // handled elsewhere
    const type = (attr(attrs, "type") ?? "submit").toLowerCase();
    if (type === "submit") {
      // still useful on SPA pages outside forms
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
      selector: id
        ? `#${id}`
        : `button:nth-of-type(${buttonIndex})`,
      label,
      id,
    });
  }

  // selects
  const selectRe = /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;
  let sm: RegExpExecArray | null;
  while ((sm = selectRe.exec(content))) {
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
      },
    ).filter(Boolean);
    const label = aria || id || name || "select";
    controls.push({
      kind: "select",
      selector: id ? `#${id}` : name ? `select[name="${name}"]` : "select",
      label,
      id,
      name,
      options,
    });
  }

  // inputs
  const inputRe = /<input\b([^>]*)\/?>/gi;
  let im: RegExpExecArray | null;
  let fileIndex = 0;
  while ((im = inputRe.exec(content))) {
    const attrs = im[1] ?? "";
    const type = (attr(attrs, "type") ?? "text").toLowerCase();
    const id = attr(attrs, "id");
    const name = attr(attrs, "name");
    const aria = attr(attrs, "aria-label");
    const accept = attr(attrs, "accept");

    if (type === "file") {
      fileIndex += 1;
      // Look backward for label text near the input
      const start = Math.max(0, im.index - 400);
      const before = content.slice(start, im.index);
      const labelMatch =
        /<label\b[^>]*>([\s\S]*?)$/i.exec(before) ||
        />([^<>]{0,80})$/.exec(before.replace(/<[^>]+>/g, ">"));
      const nearby = labelMatch
        ? stripTags(labelMatch[1] ?? "").replace(/\s*Choose image\s*/i, "image")
        : "";
      controls.push({
        kind: "file",
        selector: id
          ? `#${id}`
          : `input[type="file"]:nth-of-type(${fileIndex})`,
        label: aria || nearby || "file",
        id,
        name,
        accept,
        inputType: type,
      });
      continue;
    }

    if (type === "radio") {
      if (!name) continue;
      const value = attr(attrs, "value") ?? "";
      const existing = radioGroups.get(name);
      if (existing) {
        if (value && !existing.options?.includes(value)) {
          existing.options = [...(existing.options ?? []), value];
        }
      } else {
        radioGroups.set(name, {
          kind: "radio-group",
          selector: `input[type="radio"][name="${name}"]`,
          label: aria || name,
          name,
          options: value ? [value] : [],
          inputType: type,
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
        inputType: type,
      });
      continue;
    }

    // text-like
    if (id || name || aria) {
      controls.push({
        kind: "text",
        selector: id ? `#${id}` : name ? `input[name="${name}"]` : `input[type="${type}"]`,
        label: aria || name || id || type,
        id,
        name,
        inputType: type,
      });
    }
  }

  controls.push(...radioGroups.values());
  return { path, controls };
}
