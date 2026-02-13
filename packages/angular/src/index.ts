// Build-time tools
export { transformTemplate } from "./transform-template";
export type { TransformTemplateOptions } from "./transform-template";
export { transformInlineTemplate } from "./transform-inline-template";

// Webpack
export { LocatorAngularWebpackPlugin } from "./webpack-plugin";
export { default as htmlTemplateLoader } from "./html-template-loader";
export { default as tsInlineTemplateLoader } from "./ts-inline-template-loader";

// esbuild
export { locatorAngularEsbuildPlugin } from "./esbuild-plugin";
