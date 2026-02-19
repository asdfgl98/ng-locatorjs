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
}
interface ComponentMap {
    [className: string]: ComponentMapEntry;
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
export declare function installAngularLocator(userOptions?: AngularLocatorOptions): void;
/**
 * Uninstall the Angular locator runtime.
 */
export declare function uninstallAngularLocator(): void;
/**
 * Get the current component map.
 */
export declare function getComponentMap(): ComponentMap;
/**
 * Manually refresh the component map.
 */
export declare function refreshComponentMap(): Promise<number>;
export default installAngularLocator;
//# sourceMappingURL=runtime.d.ts.map