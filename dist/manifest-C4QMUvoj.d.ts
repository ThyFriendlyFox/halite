import { z } from 'zod';

declare const HaliteTool: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    inputSchema: z.ZodObject<{
        type: z.ZodLiteral<"object">;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        required: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        additionalProperties: z.ZodOptional<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodLiteral<"object">;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        required: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        additionalProperties: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodLiteral<"object">;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        required: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        additionalProperties: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>;
    safety: z.ZodDefault<z.ZodEnum<["read", "write", "danger"]>>;
    /** When true, runtime asks the user before execute. */
    requireConfirmation: z.ZodDefault<z.ZodBoolean>;
    /** How the analyzer found this tool. */
    source: z.ZodOptional<z.ZodObject<{
        kind: z.ZodEnum<["form", "button", "route", "api", "manual", "html", "dom"]>;
        path: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        line: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        kind: "form" | "button" | "route" | "api" | "manual" | "html" | "dom";
        path?: string | undefined;
        selector?: string | undefined;
        line?: number | undefined;
    }, {
        kind: "form" | "button" | "route" | "api" | "manual" | "html" | "dom";
        path?: string | undefined;
        selector?: string | undefined;
        line?: number | undefined;
    }>>;
    /** DOM binding for form/button/control tools. */
    binding: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["form", "click", "navigate", "custom", "set", "upload"]>;
        selector: z.ZodOptional<z.ZodString>;
        href: z.ZodOptional<z.ZodString>;
        method: z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>>;
        action: z.ZodOptional<z.ZodString>;
        /** For set tools: which arg holds the value (default value). */
        valueKey: z.ZodOptional<z.ZodString>;
        /** For radio groups: the shared name attribute. */
        name: z.ZodOptional<z.ZodString>;
        /** For upload tools: accept attribute hint. */
        accept: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "set" | "custom" | "form" | "click" | "navigate" | "upload";
        selector?: string | undefined;
        name?: string | undefined;
        href?: string | undefined;
        method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
        action?: string | undefined;
        valueKey?: string | undefined;
        accept?: string | undefined;
    }, {
        type: "set" | "custom" | "form" | "click" | "navigate" | "upload";
        selector?: string | undefined;
        name?: string | undefined;
        href?: string | undefined;
        method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
        action?: string | undefined;
        valueKey?: string | undefined;
        accept?: string | undefined;
    }>>;
    /** Approval state in the local publish workflow. */
    status: z.ZodDefault<z.ZodEnum<["draft", "approved", "rejected"]>>;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "approved" | "rejected";
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: Record<string, unknown>;
        required?: string[] | undefined;
        additionalProperties?: boolean | undefined;
    } & {
        [k: string]: unknown;
    };
    safety: "read" | "write" | "danger";
    requireConfirmation: boolean;
    source?: {
        kind: "form" | "button" | "route" | "api" | "manual" | "html" | "dom";
        path?: string | undefined;
        selector?: string | undefined;
        line?: number | undefined;
    } | undefined;
    binding?: {
        type: "set" | "custom" | "form" | "click" | "navigate" | "upload";
        selector?: string | undefined;
        name?: string | undefined;
        href?: string | undefined;
        method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
        action?: string | undefined;
        valueKey?: string | undefined;
        accept?: string | undefined;
    } | undefined;
}, {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties?: Record<string, unknown> | undefined;
        required?: string[] | undefined;
        additionalProperties?: boolean | undefined;
    } & {
        [k: string]: unknown;
    };
    status?: "draft" | "approved" | "rejected" | undefined;
    safety?: "read" | "write" | "danger" | undefined;
    requireConfirmation?: boolean | undefined;
    source?: {
        kind: "form" | "button" | "route" | "api" | "manual" | "html" | "dom";
        path?: string | undefined;
        selector?: string | undefined;
        line?: number | undefined;
    } | undefined;
    binding?: {
        type: "set" | "custom" | "form" | "click" | "navigate" | "upload";
        selector?: string | undefined;
        name?: string | undefined;
        href?: string | undefined;
        method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
        action?: string | undefined;
        valueKey?: string | undefined;
        accept?: string | undefined;
    } | undefined;
}>;
type HaliteTool = z.infer<typeof HaliteTool>;
declare const HaliteManifest: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    name: z.ZodString;
    version: z.ZodString;
    createdAt: z.ZodString;
    siteOrigin: z.ZodOptional<z.ZodString>;
    tools: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        inputSchema: z.ZodObject<{
            type: z.ZodLiteral<"object">;
            properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            required: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            additionalProperties: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodLiteral<"object">;
            properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            required: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            additionalProperties: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodLiteral<"object">;
            properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            required: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            additionalProperties: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>;
        safety: z.ZodDefault<z.ZodEnum<["read", "write", "danger"]>>;
        /** When true, runtime asks the user before execute. */
        requireConfirmation: z.ZodDefault<z.ZodBoolean>;
        /** How the analyzer found this tool. */
        source: z.ZodOptional<z.ZodObject<{
            kind: z.ZodEnum<["form", "button", "route", "api", "manual", "html", "dom"]>;
            path: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            line: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            kind: "form" | "button" | "route" | "api" | "manual" | "html" | "dom";
            path?: string | undefined;
            selector?: string | undefined;
            line?: number | undefined;
        }, {
            kind: "form" | "button" | "route" | "api" | "manual" | "html" | "dom";
            path?: string | undefined;
            selector?: string | undefined;
            line?: number | undefined;
        }>>;
        /** DOM binding for form/button/control tools. */
        binding: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["form", "click", "navigate", "custom", "set", "upload"]>;
            selector: z.ZodOptional<z.ZodString>;
            href: z.ZodOptional<z.ZodString>;
            method: z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>>;
            action: z.ZodOptional<z.ZodString>;
            /** For set tools: which arg holds the value (default value). */
            valueKey: z.ZodOptional<z.ZodString>;
            /** For radio groups: the shared name attribute. */
            name: z.ZodOptional<z.ZodString>;
            /** For upload tools: accept attribute hint. */
            accept: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "set" | "custom" | "form" | "click" | "navigate" | "upload";
            selector?: string | undefined;
            name?: string | undefined;
            href?: string | undefined;
            method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
            action?: string | undefined;
            valueKey?: string | undefined;
            accept?: string | undefined;
        }, {
            type: "set" | "custom" | "form" | "click" | "navigate" | "upload";
            selector?: string | undefined;
            name?: string | undefined;
            href?: string | undefined;
            method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
            action?: string | undefined;
            valueKey?: string | undefined;
            accept?: string | undefined;
        }>>;
        /** Approval state in the local publish workflow. */
        status: z.ZodDefault<z.ZodEnum<["draft", "approved", "rejected"]>>;
    }, "strip", z.ZodTypeAny, {
        status: "draft" | "approved" | "rejected";
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: Record<string, unknown>;
            required?: string[] | undefined;
            additionalProperties?: boolean | undefined;
        } & {
            [k: string]: unknown;
        };
        safety: "read" | "write" | "danger";
        requireConfirmation: boolean;
        source?: {
            kind: "form" | "button" | "route" | "api" | "manual" | "html" | "dom";
            path?: string | undefined;
            selector?: string | undefined;
            line?: number | undefined;
        } | undefined;
        binding?: {
            type: "set" | "custom" | "form" | "click" | "navigate" | "upload";
            selector?: string | undefined;
            name?: string | undefined;
            href?: string | undefined;
            method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
            action?: string | undefined;
            valueKey?: string | undefined;
            accept?: string | undefined;
        } | undefined;
    }, {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties?: Record<string, unknown> | undefined;
            required?: string[] | undefined;
            additionalProperties?: boolean | undefined;
        } & {
            [k: string]: unknown;
        };
        status?: "draft" | "approved" | "rejected" | undefined;
        safety?: "read" | "write" | "danger" | undefined;
        requireConfirmation?: boolean | undefined;
        source?: {
            kind: "form" | "button" | "route" | "api" | "manual" | "html" | "dom";
            path?: string | undefined;
            selector?: string | undefined;
            line?: number | undefined;
        } | undefined;
        binding?: {
            type: "set" | "custom" | "form" | "click" | "navigate" | "upload";
            selector?: string | undefined;
            name?: string | undefined;
            href?: string | undefined;
            method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
            action?: string | undefined;
            valueKey?: string | undefined;
            accept?: string | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    schemaVersion: 1;
    version: string;
    createdAt: string;
    tools: {
        status: "draft" | "approved" | "rejected";
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: Record<string, unknown>;
            required?: string[] | undefined;
            additionalProperties?: boolean | undefined;
        } & {
            [k: string]: unknown;
        };
        safety: "read" | "write" | "danger";
        requireConfirmation: boolean;
        source?: {
            kind: "form" | "button" | "route" | "api" | "manual" | "html" | "dom";
            path?: string | undefined;
            selector?: string | undefined;
            line?: number | undefined;
        } | undefined;
        binding?: {
            type: "set" | "custom" | "form" | "click" | "navigate" | "upload";
            selector?: string | undefined;
            name?: string | undefined;
            href?: string | undefined;
            method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
            action?: string | undefined;
            valueKey?: string | undefined;
            accept?: string | undefined;
        } | undefined;
    }[];
    siteOrigin?: string | undefined;
}, {
    name: string;
    schemaVersion: 1;
    version: string;
    createdAt: string;
    tools: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties?: Record<string, unknown> | undefined;
            required?: string[] | undefined;
            additionalProperties?: boolean | undefined;
        } & {
            [k: string]: unknown;
        };
        status?: "draft" | "approved" | "rejected" | undefined;
        safety?: "read" | "write" | "danger" | undefined;
        requireConfirmation?: boolean | undefined;
        source?: {
            kind: "form" | "button" | "route" | "api" | "manual" | "html" | "dom";
            path?: string | undefined;
            selector?: string | undefined;
            line?: number | undefined;
        } | undefined;
        binding?: {
            type: "set" | "custom" | "form" | "click" | "navigate" | "upload";
            selector?: string | undefined;
            name?: string | undefined;
            href?: string | undefined;
            method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
            action?: string | undefined;
            valueKey?: string | undefined;
            accept?: string | undefined;
        } | undefined;
    }[];
    siteOrigin?: string | undefined;
}>;
type HaliteManifest = z.infer<typeof HaliteManifest>;
declare const ToolSafety: z.ZodEnum<["read", "write", "danger"]>;
type ToolSafety = z.infer<typeof ToolSafety>;
declare function parseManifest(data: unknown): HaliteManifest;
declare function emptyManifest(name: string, version?: string): HaliteManifest;

export { HaliteManifest as H, ToolSafety as T, HaliteTool as a, emptyManifest as e, parseManifest as p };
