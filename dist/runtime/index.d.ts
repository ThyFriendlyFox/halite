import { H as HaliteManifest } from '../manifest-C4QMUvoj.js';
import 'zod';

type ModelContextLike = {
    registerTool: (tool: {
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
        execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
        annotations?: {
            readOnlyHint?: boolean;
            destructiveHint?: boolean;
        };
    }, options?: {
        signal?: AbortSignal;
    }) => void | Promise<void>;
};
declare function getModelContext(doc?: Document): ModelContextLike | null;
type RegisterOptions = {
    /** Only register approved tools. Default true. */
    approvedOnly?: boolean;
    signal?: AbortSignal;
    /** Override execute for a tool name. */
    executors?: Record<string, (args: Record<string, unknown>) => Promise<unknown> | unknown>;
    onRegistered?: (name: string) => void;
    onError?: (name: string, error: unknown) => void;
};
/** Register Halite tools with the browser WebMCP modelContext API. */
declare function registerManifest(manifest: HaliteManifest, options?: RegisterOptions): Promise<string[]>;
declare function emitScriptTag(manifestUrl: string): string;

export { type ModelContextLike, type RegisterOptions, emitScriptTag, getModelContext, registerManifest };
