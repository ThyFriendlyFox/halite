import { readFileSync, writeFileSync } from "node:fs";

function slugify(raw: string): string {
  const s = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  if (!s) return "submit_form";
  if (/^[0-9]/.test(s)) return `submit_${s}`;
  return s.startsWith("submit_") ? s.slice(0, 48) : `submit_${s}`.slice(0, 48);
}

export type AnnotateResult = {
  path: string;
  annotated: number;
  skipped: number;
  names: string[];
  content: string;
};

/** Add toolname / tooldescription to plain HTML forms that lack them. */
export function annotateHtml(content: string, path = "file.html"): AnnotateResult {
  const used = new Set<string>();
  // Collect existing toolnames
  for (const m of content.matchAll(/\btoolname\s*=\s*["']([^"']+)["']/gi)) {
    if (m[1]) used.add(m[1]);
  }

  let annotated = 0;
  let skipped = 0;
  const names: string[] = [];

  const next = content.replace(/<form\b([^>]*)>/gi, (full, attrs: string) => {
    if (/\btoolname\s*=/i.test(attrs)) {
      skipped += 1;
      return full;
    }
    const idMatch = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const nameMatch = /\bname\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const aria = /\baria-label\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const action = /\baction\s*=\s*["']([^"']+)["']/i.exec(attrs);
    let base = slugify(
      aria?.[1] ?? nameMatch?.[1] ?? idMatch?.[1] ?? action?.[1] ?? "form",
    );
    let name = base;
    let i = 2;
    while (used.has(name)) {
      name = `${base}_${i}`;
      i += 1;
    }
    used.add(name);
    const description = aria?.[1]
      ? `Submit form: ${aria[1]}`
      : `Submit the ${name.replace(/^submit_/, "")} form`;
    annotated += 1;
    names.push(name);
    const trimmed = attrs.trim();
    const space = trimmed.length ? " " : "";
    return `<form${space}${trimmed} toolname="${name}" tooldescription="${description.replace(/"/g, "&quot;")}">`;
  });

  return { path, annotated, skipped, names, content: next };
}

export function annotateFile(path: string, write = true): AnnotateResult {
  const original = readFileSync(path, "utf8");
  const result = annotateHtml(original, path);
  if (write && result.annotated > 0 && result.content !== original) {
    writeFileSync(path, result.content, "utf8");
  }
  return result;
}
