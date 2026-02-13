import { transformTemplate } from "./transform-template";
import { transformInlineTemplate } from "./transform-inline-template";
import * as fs from "fs";

interface EsbuildPlugin {
  name: string;
  setup(build: EsbuildBuild): void;
}

interface EsbuildBuild {
  onLoad(
    options: { filter: RegExp; namespace?: string },
    callback: (
      args: { path: string }
    ) => Promise<{ contents: string; loader: string } | undefined> | undefined
  ): void;
}

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
export function locatorAngularEsbuildPlugin(): EsbuildPlugin {
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
          const transformed = transformTemplate(source, {
            filePath: args.path,
          });
          return { contents: transformed, loader: "text" };
        } catch {
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
          if (
            !source.includes("@Component") ||
            !source.includes("template")
          ) {
            return undefined;
          }
          const transformed = transformInlineTemplate(source, args.path);
          return { contents: transformed, loader: "ts" };
        } catch {
          return undefined;
        }
      });
    },
  };
}
