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
exports.locatorAngularEsbuildPlugin = locatorAngularEsbuildPlugin;
const transform_template_1 = require("./transform-template");
const transform_inline_template_1 = require("./transform-inline-template");
const fs = __importStar(require("fs"));
/**
 * esbuild plugin for LocatorJS Angular support.
 *
 * For Angular 17+ application builder with @angular-builders/custom-esbuild.
 *
 * Usage in angular.json:
 * ```json
 * {
 *   "architect": {
 *     "build": {
 *       "builder": "@angular-builders/custom-esbuild:application",
 *       "options": {
 *         "plugins": ["./esbuild-plugins.ts"]
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * esbuild-plugins.ts:
 * ```ts
 * import { locatorAngularEsbuildPlugin } from '@locator/angular';
 * export default [locatorAngularEsbuildPlugin()];
 * ```
 */
function locatorAngularEsbuildPlugin() {
    return {
        name: "locator-angular",
        setup(build) {
            // Transform external HTML templates
            build.onLoad({ filter: /\.html$/ }, async (args) => {
                if (args.path.includes("node_modules")) {
                    return undefined;
                }
                try {
                    const source = fs.readFileSync(args.path, "utf-8");
                    const transformed = (0, transform_template_1.transformTemplate)(source, {
                        filePath: args.path,
                    });
                    return { contents: transformed, loader: "text" };
                }
                catch {
                    return undefined;
                }
            });
            // Transform inline templates in component files
            build.onLoad({ filter: /\.component\.ts$/ }, async (args) => {
                if (args.path.includes("node_modules")) {
                    return undefined;
                }
                try {
                    const source = fs.readFileSync(args.path, "utf-8");
                    if (!source.includes("@Component") ||
                        !source.includes("template")) {
                        return undefined;
                    }
                    const transformed = (0, transform_inline_template_1.transformInlineTemplate)(source, args.path);
                    return { contents: transformed, loader: "ts" };
                }
                catch {
                    return undefined;
                }
            });
        },
    };
}
