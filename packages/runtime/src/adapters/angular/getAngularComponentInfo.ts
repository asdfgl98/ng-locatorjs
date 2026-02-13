import type { Source } from "../../types/types";

/**
 * Get Angular component info using ng.getComponent() / ng.getOwningComponent().
 * This is the fallback strategy when data-locatorjs attributes are not present.
 *
 * Angular exposes debug utilities on window.ng in development mode.
 */
export function getAngularComponentInfo(
  element: HTMLElement
): { componentName: string; source: Source | null } | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ng = (window as any).ng;
  if (!ng) {
    return null;
  }

  // Try to get the component directly on this element
  let component = null;
  try {
    component =
      typeof ng.getComponent === "function"
        ? ng.getComponent(element)
        : null;
  } catch {
    // Element might not be a component host
  }

  // Fallback: get the owning component
  if (!component) {
    try {
      component =
        typeof ng.getOwningComponent === "function"
          ? ng.getOwningComponent(element)
          : null;
    } catch {
      // No owning component found
    }
  }

  if (!component) {
    return null;
  }

  const componentName =
    component.constructor?.name || component.constructor?.toString() || "AngularComponent";

  // Angular doesn't expose source location through ng debug API,
  // so source will be null for the fallback strategy.
  // The build-time plugin (data-locatorjs attributes) provides precise source locations.
  return {
    componentName,
    source: null,
  };
}
