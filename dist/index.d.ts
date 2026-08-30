export { H as HaliteManifest, a as HaliteTool, T as ToolSafety, e as emptyManifest, p as parseManifest } from './manifest-C4QMUvoj.js';
export { analyzePath, analyzeRepository, analyzeUrl, inventoryFromHtml, toolsFromInventory } from './analyze/index.js';
export { emitScriptTag, getModelContext, registerManifest } from './runtime/index.js';
import 'zod';

/** JSON Schema for Halite manifests (schemaVersion 1). */
declare const MANIFEST_JSON_SCHEMA: {
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly $id: "https://raw.githubusercontent.com/ThyFriendlyFox/halite/main/schemas/halite.manifest.schema.json";
    readonly title: "HaliteManifest";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["schemaVersion", "name", "version", "createdAt", "tools"];
    readonly properties: {
        readonly schemaVersion: {
            readonly const: 1;
        };
        readonly name: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly version: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly createdAt: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly siteOrigin: {
            readonly type: "string";
        };
        readonly tools: {
            readonly type: "array";
            readonly items: {
                readonly $ref: "#/definitions/HaliteTool";
            };
        };
    };
    readonly definitions: {
        readonly HaliteTool: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["name", "description", "inputSchema"];
            readonly properties: {
                readonly name: {
                    readonly type: "string";
                    readonly pattern: "^[a-z][a-z0-9_]*$";
                };
                readonly description: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly inputSchema: {
                    readonly type: "object";
                    readonly required: readonly ["type"];
                    readonly properties: {
                        readonly type: {
                            readonly const: "object";
                        };
                        readonly properties: {
                            readonly type: "object";
                        };
                        readonly required: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly additionalProperties: {
                            readonly type: "boolean";
                        };
                    };
                    readonly additionalProperties: true;
                };
                readonly safety: {
                    readonly enum: readonly ["read", "write", "danger"];
                    readonly default: "write";
                };
                readonly requireConfirmation: {
                    readonly type: "boolean";
                    readonly default: false;
                };
                readonly source: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly enum: readonly ["form", "button", "route", "api", "manual", "html", "dom"];
                        };
                        readonly path: {
                            readonly type: "string";
                        };
                        readonly selector: {
                            readonly type: "string";
                        };
                        readonly line: {
                            readonly type: "integer";
                            readonly minimum: 1;
                        };
                    };
                    readonly required: readonly ["kind"];
                    readonly additionalProperties: false;
                };
                readonly binding: {
                    readonly type: "object";
                    readonly properties: {
                        readonly type: {
                            readonly enum: readonly ["form", "click", "navigate", "custom", "set", "upload"];
                        };
                        readonly valueKey: {
                            readonly type: "string";
                        };
                        readonly name: {
                            readonly type: "string";
                        };
                        readonly accept: {
                            readonly type: "string";
                        };
                        readonly selector: {
                            readonly type: "string";
                        };
                        readonly href: {
                            readonly type: "string";
                        };
                        readonly method: {
                            readonly enum: readonly ["GET", "POST", "PUT", "PATCH", "DELETE"];
                        };
                        readonly action: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["type"];
                    readonly additionalProperties: false;
                };
                readonly status: {
                    readonly enum: readonly ["draft", "approved", "rejected"];
                    readonly default: "draft";
                };
            };
        };
    };
};
declare function manifestJsonSchema(): typeof MANIFEST_JSON_SCHEMA;

type AnnotateResult = {
    path: string;
    annotated: number;
    skipped: number;
    names: string[];
    content: string;
};
/** Add toolname / tooldescription to plain HTML forms that lack them. */
declare function annotateHtml(content: string, path?: string): AnnotateResult;
declare function annotateFile(path: string, write?: boolean): AnnotateResult;

export { annotateFile, annotateHtml, manifestJsonSchema };
