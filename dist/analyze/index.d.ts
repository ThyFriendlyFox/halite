import { a as HaliteTool } from '../manifest-C4QMUvoj.js';
import 'zod';

type DomControl = {
    kind: "button" | "select" | "radio-group" | "file" | "checkbox" | "text";
    selector: string;
    label: string;
    name?: string;
    id?: string;
    options?: string[];
    accept?: string;
    inputType?: string;
};
type DomInventory = {
    path?: string;
    url?: string;
    controls: DomControl[];
};
/** Turn a DOM control inventory into draft Halite tools. */
declare function toolsFromInventory(inventory: DomInventory, used?: Set<string>): HaliteTool[];

/**
 * Heuristic HTML control inventory for SPA pages without <form>.
 * Complements form-based analysis in analyzeHtml.
 */
declare function inventoryFromHtml(content: string, path?: string): DomInventory;

type AnalyzeUrlOptions = {
    url: string;
    /** Upload a tiny PNG into the first file input to reveal post-upload UI. */
    probe?: boolean;
    /** Path to Chrome/Chromium. Defaults to common locations + Playwright channel. */
    executablePath?: string;
    timeoutMs?: number;
};
/**
 * Render a public URL and propose tools from the live DOM.
 * Uses Playwright + system Chrome. Does not authenticate.
 */
declare function analyzeUrl(options: AnalyzeUrlOptions): Promise<{
    tools: HaliteTool[];
    inventory: DomInventory;
}>;

type AnalyzeOptions = {
    root: string;
    include?: string[];
    exclude?: string[];
};

/** Static analysis of a local repository. Does not run project code. */
declare function analyzeRepository(options: AnalyzeOptions): HaliteTool[];
declare function analyzePath(root: string): HaliteTool[];

export { type AnalyzeOptions, analyzePath, analyzeRepository, analyzeUrl, inventoryFromHtml, toolsFromInventory };
