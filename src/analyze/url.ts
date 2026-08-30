import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { HaliteTool } from "../schema/manifest.js";
import { toolsFromInventory, type DomControl, type DomInventory } from "./dom-tools.js";

export type AnalyzeUrlOptions = {
  url: string;
  /** Upload a tiny PNG into the first file input to reveal post-upload UI. */
  probe?: boolean;
  /** Path to Chrome/Chromium. Defaults to common locations + Playwright channel. */
  executablePath?: string;
  timeoutMs?: number;
};

type PlaywrightModule = {
  chromium: {
    executablePath?: () => string;
    launch: (opts: {
      headless?: boolean;
      executablePath?: string;
      channel?: string;
      args?: string[];
    }) => Promise<{
      newPage: () => Promise<PageLike>;
      close: () => Promise<void>;
    }>;
  };
};

type PageLike = {
  goto: (url: string, opts?: { waitUntil?: string; timeout?: number }) => Promise<unknown>;
  waitForTimeout: (ms: number) => Promise<void>;
  content: () => Promise<string>;
  evaluate: <T>(fn: () => T) => Promise<T>;
  locator: (sel: string) => {
    count: () => Promise<number>;
    first: () => { setInputFiles: (path: string) => Promise<void> };
  };
};

async function loadPlaywright(): Promise<PlaywrightModule> {
  try {
    return (await import("playwright-core")) as unknown as PlaywrightModule;
  } catch {
    throw new Error(
      'Live URL analysis requires playwright-core. Run: pnpm add playwright-core',
    );
  }
}

function resolveChrome(explicit?: string): string | undefined {
  if (explicit && existsSync(explicit)) return explicit;
  const candidates = [
    process.env.CHROME_PATH,
    process.env.HALITE_CHROME,
    "/usr/local/bin/google-chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean) as string[];
  return candidates.find((p) => p && existsSync(p));
}

function resolveBrowserPath(
  pw: PlaywrightModule,
  explicit?: string,
): string | undefined {
  const system = resolveChrome(explicit);
  if (system) return system;
  try {
    const fromPw = pw.chromium.executablePath?.();
    if (fromPw && existsSync(fromPw)) return fromPw;
  } catch {
    /* not installed */
  }
  return undefined;
}

function tinyPngPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "halite-probe-"));
  // 1x1 blue PNG
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const path = join(dir, "probe.png");
  writeFileSync(path, png);
  return path;
}

/** Collect interactive controls from a live document. */
function collectInventoryScript(): DomInventory {
  const cssEscape = (window as unknown as { CSS?: { escape?: (s: string) => string } }).CSS
    ?.escape
    ? (s: string) => window.CSS.escape(s)
    : (s: string) => s.replace(/"/g, '\\"');

  const controls: DomControl[] = [];
  const buttons = [...document.querySelectorAll("button")];
  buttons.forEach((b, i) => {
    if (b.disabled) return;
    const label =
      b.getAttribute("aria-label") ||
      (b.textContent || "").replace(/\s+/g, " ").trim();
    if (!label) return;
    const selector = b.id
      ? `#${cssEscape(b.id)}`
      : `button:nth-of-type(${i + 1})`;
    controls.push({ kind: "button", selector, label, id: b.id || undefined });
  });

  for (const sel of [...document.querySelectorAll("select")]) {
    const options = [...sel.options].map((o) => o.value || o.text).filter(Boolean);
    const label =
      sel.getAttribute("aria-label") ||
      sel.id ||
      sel.name ||
      "select";
    const selector = sel.id
      ? `#${cssEscape(sel.id)}`
      : sel.name
        ? `select[name="${cssEscape(sel.name)}"]`
        : "select";
    controls.push({
      kind: "select",
      selector,
      label,
      id: sel.id || undefined,
      name: sel.name || undefined,
      options,
    });
  }

  const radioNames = new Set<string>();
  for (const input of [...document.querySelectorAll("input")]) {
    const type = (input.type || "text").toLowerCase();
    if (type === "file") {
      const labelEl = input.closest("label") || document.querySelector(`label[for="${input.id}"]`);
      const label =
        input.getAttribute("aria-label") ||
        (labelEl?.textContent || "").replace(/\s+/g, " ").trim() ||
        "file";
      const selector = input.id
        ? `#${cssEscape(input.id)}`
        : 'input[type="file"]';
      controls.push({
        kind: "file",
        selector,
        label,
        id: input.id || undefined,
        name: input.name || undefined,
        accept: input.accept || undefined,
        inputType: type,
      });
      continue;
    }
    if (type === "radio") {
      if (!input.name || radioNames.has(input.name)) continue;
      radioNames.add(input.name);
      const group = [
        ...document.querySelectorAll(`input[type="radio"][name="${cssEscape(input.name)}"]`),
      ] as HTMLInputElement[];
      controls.push({
        kind: "radio-group",
        selector: `input[type="radio"][name="${cssEscape(input.name)}"]`,
        label: input.name,
        name: input.name,
        options: group.map((g) => g.value).filter(Boolean),
        inputType: type,
      });
      continue;
    }
    if (["hidden", "submit", "button", "reset", "image"].includes(type)) continue;
    if (type === "checkbox") {
      controls.push({
        kind: "checkbox",
        selector: input.id
          ? `#${cssEscape(input.id)}`
          : input.name
            ? `input[name="${cssEscape(input.name)}"]`
            : 'input[type="checkbox"]',
        label:
          input.getAttribute("aria-label") ||
          input.name ||
          input.id ||
          "checkbox",
        id: input.id || undefined,
        name: input.name || undefined,
        inputType: type,
      });
      continue;
    }
    if (input.id || input.name || input.getAttribute("aria-label")) {
      controls.push({
        kind: "text",
        selector: input.id
          ? `#${cssEscape(input.id)}`
          : input.name
            ? `input[name="${cssEscape(input.name)}"]`
            : `input[type="${type}"]`,
        label:
          input.getAttribute("aria-label") ||
          input.name ||
          input.id ||
          type,
        id: input.id || undefined,
        name: input.name || undefined,
        inputType: type,
      });
    }
  }

  return { url: location.href, controls };
}

/**
 * Render a public URL and propose tools from the live DOM.
 * Uses Playwright + system Chrome. Does not authenticate.
 */
export async function analyzeUrl(
  options: AnalyzeUrlOptions,
): Promise<{ tools: HaliteTool[]; inventory: DomInventory }> {
  const pw = await loadPlaywright();
  const executablePath = resolveBrowserPath(pw, options.executablePath);
  const browser = await pw.chromium.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    // Modern marketing sites rarely go network-idle (analytics/websockets).
    await page.goto(options.url, {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs ?? 60000,
    });
    await page.waitForTimeout(3000);

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
