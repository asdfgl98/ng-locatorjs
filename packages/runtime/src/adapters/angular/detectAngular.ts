/**
 * Detect if the current page is an Angular application.
 *
 * Uses two detection strategies:
 * 1. Check for ng.getComponent (Angular debug API, available in dev mode)
 * 2. Check for [ng-version] attribute on the root element
 */
export function detectAngular(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // Check for Angular debug utilities (available in dev mode)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ng = (window as any).ng;
  if (ng && typeof ng.getComponent === "function") {
    return true;
  }

  // Check for ng-version attribute (set by Angular on the root component)
  if (typeof document !== "undefined") {
    const ngVersionElement = document.querySelector("[ng-version]");
    if (ngVersionElement) {
      return true;
    }
  }

  return false;
}
