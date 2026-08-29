import {
  getModelContext,
  registerManifest,
  type RegisterOptions,
} from "./index.js";
import type { HaliteManifest } from "../schema/manifest.js";

declare global {
  interface Window {
    Halite?: {
      register: typeof registerFromScript;
      registerManifest: typeof registerManifest;
      getModelContext: typeof getModelContext;
    };
  }
}

async function loadManifest(url: string): Promise<HaliteManifest> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    throw new Error(`Failed to load Halite manifest: ${res.status} ${url}`);
  }
  return (await res.json()) as HaliteManifest;
}

async function registerFromScript(
  manifestUrl?: string,
  options?: RegisterOptions,
): Promise<string[]> {
  const script = document.currentScript as HTMLScriptElement | null;
  const url =
    manifestUrl ??
    script?.dataset.haliteManifest ??
    document
      .querySelector<HTMLScriptElement>("script[data-halite-manifest]")
      ?.dataset.haliteManifest;
  if (!url) {
    throw new Error("Pass a manifest URL or set data-halite-manifest on the script tag");
  }
  const manifest = await loadManifest(url);
  return registerManifest(manifest, options);
}

function autoBoot() {
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>("script[data-halite-manifest]"),
  );
  for (const script of scripts) {
    const url = script.dataset.haliteManifest;
    if (!url) continue;
    const approvedOnly = script.dataset.haliteApprovedOnly !== "false";
    void loadManifest(url)
      .then((manifest) =>
        registerManifest(manifest, {
          approvedOnly,
          onError: (name, err) => {
            console.warn(`[halite] failed to register ${name}`, err);
          },
        }),
      )
      .then((names) => {
        console.info(`[halite] registered ${names.length} tool(s)`, names);
      })
      .catch((err) => {
        console.warn("[halite] boot failed", err);
      });
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoBoot, { once: true });
  } else {
    autoBoot();
  }
}

export { registerFromScript as register, registerManifest, getModelContext };
