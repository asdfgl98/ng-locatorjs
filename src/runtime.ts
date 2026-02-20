/**
 * Runtime module for LocatorJS Angular.
 *
 * This provides a runtime-based approach:
 * - Uses ng.getComponent() to detect Angular components
 * - Communicates with a local server to get file paths from component map
 * - No build-time transformation required
 */

export interface AngularLocatorOptions {
  /** Enable network requests for component map (default: true) */
  enableNetwork?: boolean;
  /** Custom port for the file opener server (default: 4123) */
  port?: number;
  /** Editor to use for opening files */
  editor?: "cursor" | "code" | "webstorm" | "windsurf" | "antigravity";
  /** Custom component map URL */
  componentMapUrl?: string;
  /** Custom open URL template */
  openUrlTemplate?: string;
  /** Custom modifier key (default: 'alt') */
  modifier?: "alt" | "ctrl" | "meta" | "shift";
}

interface ComponentMapEntry {
  filePath: string;
  selector: string | null;
  templateFilePath: string | null;
}

interface ComponentMap {
  [className: string]: ComponentMapEntry;
}

let componentMap: ComponentMap = {};
let options: Required<AngularLocatorOptions>;
let isInitialized = false;
let isActive = false;
let highlightedElements: Set<HTMLElement> = new Set();
let currentHoverElement: HTMLElement | null = null;
let tooltipElement: HTMLDivElement | null = null;

const DEFAULT_OPTIONS: Required<AngularLocatorOptions> = {
  enableNetwork: true,
  port: 4123,
  editor: "cursor",
  componentMapUrl: "",
  openUrlTemplate: "",
  modifier: "alt",
};

const HIGHLIGHT_STYLE_ID = "__locator_highlight_style__";
const TOOLTIP_ID = "__locator_tooltip__";

/**
 * Inject highlight styles
 */
function injectStyles(): void {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = `
    .__locator_highlight__ {
      outline: 2px solid #0066ff !important;
      outline-offset: -2px !important;
      cursor: crosshair !important;
    }
    .__locator_hover__ {
      outline: 2px solid #ff6600 !important;
      outline-offset: -2px !important;
      background-color: rgba(255, 102, 0, 0.1) !important;
    }
    #__locator_tooltip__ {
      position: fixed !important;
      padding: 4px 8px !important;
      background: #1a1a1a !important;
      color: #fff !important;
      font-family: monospace !important;
      font-size: 12px !important;
      border-radius: 4px !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      white-space: nowrap !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
    }
    #__locator_tooltip__ .__locator_file__ {
      color: #88ccff !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Create tooltip element
 */
function createTooltip(): HTMLDivElement {
  if (tooltipElement) {
    return tooltipElement;
  }

  const tooltip = document.createElement("div");
  tooltip.id = TOOLTIP_ID;
  tooltip.style.display = "none";
  document.body.appendChild(tooltip);
  tooltipElement = tooltip;
  return tooltip;
}

/**
 * Show tooltip for component
 */
function showTooltip(element: HTMLElement, componentName: string, filePath?: string): void {
  const tooltip = createTooltip();
  const rect = element.getBoundingClientRect();

  tooltip.innerHTML = `<div>${componentName}</div>${filePath ? `<div class="__locator_file__">${filePath}</div>` : ""}`;
  tooltip.style.display = "block";
  tooltip.style.left = `${rect.left}px`;
  tooltip.style.top = `${rect.bottom + 4}px`;
}

/**
 * Hide tooltip
 */
function hideTooltip(): void {
  if (tooltipElement) {
    tooltipElement.style.display = "none";
  }
}

/**
 * Get the Angular component from an element using ng debug API.
 */
function getAngularComponent(element: HTMLElement): { component: unknown; name: string } | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ng = (window as any).ng;
  if (!ng) {
    return null;
  }

  let component = null;
  try {
    component = typeof ng.getComponent === "function" ? ng.getComponent(element) : null;
  } catch {
    // Element might not be a component host
  }

  if (!component) {
    try {
      component = typeof ng.getOwningComponent === "function" ? ng.getOwningComponent(element) : null;
    } catch {
      // No owning component found
    }
  }

  if (!component) {
    return null;
  }

  const name = (component as { constructor?: { name?: string } }).constructor?.name || "UnknownComponent";
  return { component, name };
}

/**
 * Check if element is visible
 */
function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

/**
 * Find all Angular component host elements
 */
function findComponentElements(): HTMLElement[] {
  const elements: HTMLElement[] = [];
  const allElements = Array.from(document.querySelectorAll("*"));

  for (const el of allElements) {
    if (el instanceof HTMLElement && isVisible(el)) {
      const info = getAngularComponent(el);
      if (info) {
        elements.push(el);
      }
    }
  }

  return elements;
}

/**
 * Activate highlight mode
 */
function activateHighlight(): void {
  if (isActive) return;
  isActive = true;

  injectStyles();
  const components = findComponentElements();

  for (const el of components) {
    el.classList.add("__locator_highlight__");
    highlightedElements.add(el);
  }
}

/**
 * Deactivate highlight mode
 */
function deactivateHighlight(): void {
  if (!isActive) return;
  isActive = false;

  for (const el of highlightedElements) {
    el.classList.remove("__locator_highlight__");
    el.classList.remove("__locator_hover__");
  }
  highlightedElements.clear();
  currentHoverElement = null;
  hideTooltip();
}

/**
 * Handle keydown event
 */
function handleKeyDown(event: KeyboardEvent): void {
  const modifierKey = `${options.modifier}Key` as keyof KeyboardEvent;
  if (event[modifierKey]) {
    if (!isActive) {
      activateHighlight();
    }
    // Prevent default browser behavior (e.g. Menu bar on Windows, system shortcuts on Mac/Linux)
    event.preventDefault();
  }
}

/**
 * Handle keyup event
 */
function handleKeyUp(event: KeyboardEvent): void {
  const modifierKey = `${options.modifier}Key` as keyof KeyboardEvent;
  if (!event[modifierKey] && isActive) {
    deactivateHighlight();
  }
}

/**
 * Handle mouseover for hover effect
 */
function handleMouseOver(event: MouseEvent): void {
  if (!isActive) return;

  const target = event.target as HTMLElement;
  if (!target) return;

  // Remove previous hover
  if (currentHoverElement) {
    currentHoverElement.classList.remove("__locator_hover__");
  }

  // Find component
  let current: HTMLElement | null = target;
  while (current) {
    if (highlightedElements.has(current)) {
      current.classList.add("__locator_hover__");
      currentHoverElement = current;

      // Show tooltip
      const info = getAngularComponent(current);
      if (info) {
        const entry = componentMap[info.name];
        showTooltip(current, info.name, entry?.filePath);
      }
      return;
    }
    current = current.parentElement;
  }

  currentHoverElement = null;
  hideTooltip();
}

/**
 * Handle mouseout
 */
function handleMouseOut(event: MouseEvent): void {
  if (!isActive) return;

  const target = event.target as HTMLElement;
  if (target && highlightedElements.has(target)) {
    target.classList.remove("__locator_hover__");
  }
}

/**
 * Fetch the component map from the server.
 */
async function fetchComponentMap(): Promise<ComponentMap> {
  const url = options.componentMapUrl || `http://localhost:${options.port}/__locator__/map`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {};
    }
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * Open a file in the editor via the server.
 */
async function openFile(filePath: string, line: number = 1, column: number = 1, tag?: string): Promise<boolean> {
  let url = options.openUrlTemplate || `http://localhost:${options.port}/__locator__/open?file=${encodeURIComponent(filePath)}&line=${line}&column=${column}&editor=${options.editor}`;
  if (tag) {
    url += `&tag=${encodeURIComponent(tag)}`;
  }

  try {
    const response = await fetch(url);
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

/**
 * Given a click target and a component host element, determine:
 * 1. The "effective" element to report (walks up from target to find the nearest ancestor
 *    that is a direct/meaningful child of the component host, using the target itself if
 *    it is already a known HTML interactive/block element like button, a, input, etc.)
 * 2. The 0-based index of that element among same-tag siblings within the component host.
 *
 * This handles the common case where event.target is an inner text node or icon inside
 * a <button>, which would otherwise make tagName = "span" and index = -1.
 */
function resolveClickedTagInfo(componentHost: HTMLElement, target: HTMLElement): { tagName: string; tagIndex: number } {
  // Prefer walking up to a "meaningful" element before the component host
  // These are tags that are typically the intended click target in templates
  const MEANINGFUL_TAGS = new Set(["button", "a", "input", "select", "textarea", "label", "li", "tr", "td", "th", "details", "summary"]);

  // Walk from target up to (but not including) the component host
  let el: HTMLElement | null = target;
  while (el && el !== componentHost) {
    if (MEANINGFUL_TAGS.has(el.tagName.toLowerCase())) {
      // Found a meaningful ancestor — use it as the effective element
      const tagName = el.tagName.toLowerCase();
      const sameTagElements = Array.from(componentHost.querySelectorAll(tagName));
      const index = sameTagElements.indexOf(el);
      return { tagName, tagIndex: index >= 0 ? index : 0 };
    }
    el = el.parentElement;
  }

  // No meaningful ancestor found: use the original target
  const tagName = target.tagName.toLowerCase();
  const sameTagElements = Array.from(componentHost.querySelectorAll(tagName));
  const index = sameTagElements.indexOf(target);
  return { tagName, tagIndex: index >= 0 ? index : 0 };
}

/**
 * Open a component by its class name.
 */
async function openComponent(componentName: string, targetTag?: string, tagIndex: number = 0): Promise<boolean> {
  const entry = componentMap[componentName];
  if (entry) {
    // If templateFilePath exists and tag is given, open via open-component endpoint
    if (targetTag && entry.templateFilePath) {
      const url = `http://localhost:${options.port}/__locator__/open-component?component=${encodeURIComponent(componentName)}&tag=${encodeURIComponent(targetTag)}&tagIndex=${tagIndex}&editor=${options.editor}`;
      try {
        const response = await fetch(url);
        const result = (await response.json()) as { success?: boolean };
        if (result.success === true) return true;
      } catch {
        // Fallback to opening ts file
      }
    }
    return openFile(entry.filePath);
  }

  const freshMap = await fetchComponentMap();
  const freshEntry = freshMap[componentName];
  if (freshEntry) {
    componentMap = freshMap;
    if (targetTag && freshEntry.templateFilePath) {
      const url = `http://localhost:${options.port}/__locator__/open-component?component=${encodeURIComponent(componentName)}&tag=${encodeURIComponent(targetTag)}&tagIndex=${tagIndex}&editor=${options.editor}`;
      try {
        const response = await fetch(url);
        const result = (await response.json()) as { success?: boolean };
        if (result.success === true) return true;
      } catch {
        // Fallback
      }
    }
    return openFile(freshEntry.filePath);
  }

  return false;
}

/**
 * Handle click events with modifier key.
 */
function handleClick(event: MouseEvent): void {
  const modifierKey = `${options.modifier}Key` as keyof MouseEvent;
  if (!(modifierKey in event) || !event[modifierKey]) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const target = event.target as HTMLElement;
  if (!target) {
    return;
  }

  // First check if this element is in our highlighted set
  let current: HTMLElement | null = target;
  while (current) {
    if (highlightedElements.has(current)) {
      const info = getAngularComponent(current);
      if (info) {
        const { tagName: clickedTag, tagIndex } = resolveClickedTagInfo(current, target);
        openComponent(info.name, clickedTag, tagIndex);
        return;
      }
    }
    current = current.parentElement;
  }

  // Fallback: try to find any Angular component
  current = target;
  while (current) {
    const info = getAngularComponent(current);
    if (info) {
      const { tagName: clickedTag, tagIndex } = resolveClickedTagInfo(current, target);
      openComponent(info.name, clickedTag, tagIndex);
      return;
    }
    current = current.parentElement;
  }
}

/**
 * Check if we're in an Angular application.
 */
function detectAngular(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ng = (window as any).ng;
  if (ng && typeof ng.getComponent === "function") {
    return true;
  }

  if (typeof document !== "undefined") {
    const ngVersionElement = document.querySelector("[ng-version]");
    if (ngVersionElement) {
      return true;
    }
  }

  return false;
}

/**
 * Initialize the component map.
 */
async function initializeComponentMap(): Promise<void> {
  if (!options.enableNetwork) {
    return;
  }
  componentMap = await fetchComponentMap();
}

/**
 * Install the Angular locator runtime.
 *
 * @param userOptions - Configuration options
 *
 * @example
 * ```typescript
 * import { installAngularLocator } from '@locator/angular/runtime';
 *
 * // Wait for Angular to be ready
 * function initLocator() {
 *   if ((window as any).ng?.getComponent) {
 *     installAngularLocator({ editor: 'cursor' });
 *   } else {
 *     setTimeout(initLocator, 100);
 *   }
 * }
 *
 * if (document.readyState === 'complete') {
 *   initLocator();
 * } else {
 *   window.addEventListener('load', initLocator);
 * }
 * ```
 */
export function installAngularLocator(userOptions: AngularLocatorOptions = {}): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (isInitialized) {
    return;
  }

  options = { ...DEFAULT_OPTIONS, ...userOptions };

  if (!detectAngular()) {
    return;
  }

  isInitialized = true;
  initializeComponentMap();

  // Click handler
  document.addEventListener("click", handleClick, true);

  // Highlight mode handlers
  document.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("keyup", handleKeyUp, true);
  document.addEventListener("mouseover", handleMouseOver, true);
  document.addEventListener("mouseout", handleMouseOut, true);

  // Deactivate on window blur
  window.addEventListener("blur", deactivateHighlight);
}

/**
 * Uninstall the Angular locator runtime.
 */
export function uninstallAngularLocator(): void {
  if (!isInitialized) {
    return;
  }

  deactivateHighlight();

  document.removeEventListener("click", handleClick, true);
  document.removeEventListener("keydown", handleKeyDown, true);
  document.removeEventListener("keyup", handleKeyUp, true);
  document.removeEventListener("mouseover", handleMouseOver, true);
  document.removeEventListener("mouseout", handleMouseOut, true);
  window.removeEventListener("blur", deactivateHighlight);

  // Remove tooltip
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }

  isInitialized = false;
  componentMap = {};
}

/**
 * Get the current component map.
 */
export function getComponentMap(): ComponentMap {
  return { ...componentMap };
}

/**
 * Manually refresh the component map.
 */
export async function refreshComponentMap(): Promise<number> {
  componentMap = await fetchComponentMap();
  return Object.keys(componentMap).length;
}

export default installAngularLocator;
