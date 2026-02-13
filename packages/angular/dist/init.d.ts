/**
 * Runtime initialization for LocatorJS in Angular applications.
 *
 * Import this in your main.ts:
 * ```ts
 * import '@locator/angular/init';
 * ```
 *
 * This will:
 * - Skip initialization on the server (SSR)
 * - Wait for the document to be ready / hydration to complete
 * - Dynamically import and setup the LocatorJS runtime
 */
declare function initLocator(): void;
//# sourceMappingURL=init.d.ts.map