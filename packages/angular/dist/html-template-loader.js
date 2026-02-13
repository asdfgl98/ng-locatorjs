"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transform_template_1 = require("./transform-template");
/**
 * Webpack loader for Angular external HTML templates (.html files).
 * Must run with enforce: 'pre' before @ngtools/webpack.
 */
function htmlTemplateLoader(source) {
    const callback = this.async();
    const filePath = this.resourcePath;
    // Skip node_modules
    if (filePath.includes("node_modules")) {
        callback(null, source);
        return;
    }
    try {
        const result = (0, transform_template_1.transformTemplate)(source, { filePath });
        callback(null, result);
    }
    catch (error) {
        console.warn(`[@locator/angular] Failed to transform ${filePath}:`, error instanceof Error ? error.message : String(error));
        callback(null, source);
    }
}
exports.default = htmlTemplateLoader;
