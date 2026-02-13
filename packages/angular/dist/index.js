"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.locatorAngularEsbuildPlugin = exports.tsInlineTemplateLoader = exports.htmlTemplateLoader = exports.LocatorAngularWebpackPlugin = exports.transformInlineTemplate = exports.transformTemplate = void 0;
// Build-time tools
var transform_template_1 = require("./transform-template");
Object.defineProperty(exports, "transformTemplate", { enumerable: true, get: function () { return transform_template_1.transformTemplate; } });
var transform_inline_template_1 = require("./transform-inline-template");
Object.defineProperty(exports, "transformInlineTemplate", { enumerable: true, get: function () { return transform_inline_template_1.transformInlineTemplate; } });
// Webpack
var webpack_plugin_1 = require("./webpack-plugin");
Object.defineProperty(exports, "LocatorAngularWebpackPlugin", { enumerable: true, get: function () { return webpack_plugin_1.LocatorAngularWebpackPlugin; } });
var html_template_loader_1 = require("./html-template-loader");
Object.defineProperty(exports, "htmlTemplateLoader", { enumerable: true, get: function () { return __importDefault(html_template_loader_1).default; } });
var ts_inline_template_loader_1 = require("./ts-inline-template-loader");
Object.defineProperty(exports, "tsInlineTemplateLoader", { enumerable: true, get: function () { return __importDefault(ts_inline_template_loader_1).default; } });
// esbuild
var esbuild_plugin_1 = require("./esbuild-plugin");
Object.defineProperty(exports, "locatorAngularEsbuildPlugin", { enumerable: true, get: function () { return esbuild_plugin_1.locatorAngularEsbuildPlugin; } });
