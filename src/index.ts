export {
  HaliteManifest,
  HaliteTool,
  ToolSafety,
  parseManifest,
  emptyManifest,
} from "./schema/manifest.js";
export { manifestJsonSchema } from "./schema/json-schema.js";
export { analyzeRepository, analyzePath, analyzeUrl } from "./analyze/index.js";
export { annotateHtml, annotateFile } from "./analyze/annotate.js";
export { inventoryFromHtml } from "./analyze/html-controls.js";
export { toolsFromInventory } from "./analyze/dom-tools.js";
export {
  registerManifest,
  getModelContext,
  emitScriptTag,
} from "./runtime/index.js";
