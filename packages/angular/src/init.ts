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

function initLocator(): void {
  // SSR guard: skip on server
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const setup = () => {
    // Dynamically load the locatorjs runtime
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    try {
      const locatorModule = require("@locator/runtime");
      if (typeof locatorModule.setup === "function") {
        locatorModule.setup({});
      }
    } catch {
      // LocatorJS runtime not available, silently skip
    }
  };

  // Wait for the page to be ready (handles hydration timing)
  if (document.readyState === "complete") {
    setup();
  } else {
    window.addEventListener("load", setup, { once: true });
  }
}

initLocator();
