interface EsbuildPlugin {
    name: string;
    setup(build: EsbuildBuild): void;
}
interface EsbuildBuild {
    onLoad(options: {
        filter: RegExp;
        namespace?: string;
    }, callback: (args: {
        path: string;
    }) => Promise<{
        contents: string;
        loader: string;
    } | undefined> | undefined): void;
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
export declare function locatorAngularEsbuildPlugin(): EsbuildPlugin;
export {};
//# sourceMappingURL=esbuild-plugin.d.ts.map