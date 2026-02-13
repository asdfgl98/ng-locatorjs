interface Compiler {
    options: {
        module: {
            rules: any[];
        };
    };
}
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
export declare class LocatorAngularWebpackPlugin {
    apply(compiler: Compiler): void;
}
export {};
//# sourceMappingURL=webpack-plugin.d.ts.map