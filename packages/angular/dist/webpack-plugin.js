"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocatorAngularWebpackPlugin = void 0;
const path = __importStar(require("path"));
/**
 * Webpack plugin for LocatorJS Angular support.
 *
 * Adds pre-loaders that inject data-locatorjs attributes into Angular templates
 * before the Angular compiler (@ngtools/webpack) processes them.
 *
 * Usage in angular.json (with @angular-builders/custom-webpack):
 * ```json
 * {
 *   "architect": {
 *     "build": {
 *       "builder": "@angular-builders/custom-webpack:browser",
 *       "options": {
 *         "customWebpackConfig": {
 *           "path": "./webpack.config.js"
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * webpack.config.js:
 * ```js
 * const { LocatorAngularWebpackPlugin } = require('@locator/angular');
 * module.exports = { plugins: [new LocatorAngularWebpackPlugin()] };
 * ```
 */
class LocatorAngularWebpackPlugin {
    apply(compiler) {
        const htmlLoaderPath = path.resolve(__dirname, "html-template-loader.js");
        const tsLoaderPath = path.resolve(__dirname, "ts-inline-template-loader.js");
        compiler.options.module.rules.push({
            test: /\.html$/,
            enforce: "pre",
            exclude: /node_modules/,
            use: [{ loader: htmlLoaderPath }],
        }, {
            test: /\.component\.ts$/,
            enforce: "pre",
            exclude: /node_modules/,
            use: [{ loader: tsLoaderPath }],
        });
    }
}
exports.LocatorAngularWebpackPlugin = LocatorAngularWebpackPlugin;
