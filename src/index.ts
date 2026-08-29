export {
  HaliteManifest,
  HaliteTool,
  ToolSafety,
  parseManifest,
  emptyManifest,
} from "./schema/manifest.js";
export { manifestJsonSchema } from "./schema/json-schema.js";
export { analyzeRepository, analyzePath } from "./analyze/index.js";
export { annotateHtml, annotateFile } from "./analyze/annotate.js";
export {
  registerManifest,
  getModelContext,
  emitScriptTag,
} from "./runtime/index.js";
