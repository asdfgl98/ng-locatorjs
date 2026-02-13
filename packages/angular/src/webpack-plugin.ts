import * as path from "path";

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
export class LocatorAngularWebpackPlugin {
  apply(compiler: Compiler): void {
    const htmlLoaderPath = path.resolve(__dirname, "html-template-loader.js");
    const tsLoaderPath = path.resolve(
      __dirname,
      "ts-inline-template-loader.js"
    );

    compiler.options.module.rules.push(
      {
        test: /\.html$/,
        enforce: "pre" as const,
        exclude: /node_modules/,
        use: [{ loader: htmlLoaderPath }],
      },
      {
        test: /\.component\.ts$/,
        enforce: "pre" as const,
        exclude: /node_modules/,
        use: [{ loader: tsLoaderPath }],
      }
    );
  }
}
