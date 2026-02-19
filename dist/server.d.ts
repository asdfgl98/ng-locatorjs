#!/usr/bin/env node
/**
 * Local development server for LocatorJS Angular.
 *
 * Provides:
 * 1. Component map API endpoint
 * 2. File opening endpoint with template tag line detection
 * 3. Built-in component scanning with watch mode
 *
 * Usage:
 *   npx locator-angular-server [options]
 *
 * Options:
 *   --port, -p      Server port (default: 4123)
 *   --editor, -e    Default editor (cursor, code, webstorm)
 *   --map, -m       Path to component map file (default: .locator/component-map.json)
 *   --watch, -w     Enable auto-scan and watch mode (no need for ng-locator-scan)
 *   --config, -c    Config file path for scanning (default: locator.config.json)
 *   --include, -i   Additional glob patterns to scan (can be used multiple times)
 *   --exclude, -x   Additional directories to exclude (can be used multiple times)
 */
import http from "http";
interface ServerOptions {
    port?: number;
    editor?: string;
    mapPath?: string;
    watch?: boolean;
    configPath?: string;
    /** Custom scan configuration to merge with defaults/config file */
    scanConfig?: {
        /** Additional glob patterns to include (appended to defaults) */
        include?: string[];
        /** Additional directories to exclude (appended to defaults) */
        exclude?: string[];
    };
}
export declare function startServer(serverOptions?: ServerOptions): http.Server;
export {};
//# sourceMappingURL=server.d.ts.map