#!/usr/bin/env node
/**
 * Local development server for LocatorJS Angular.
 *
 * Provides:
 * 1. Component map API endpoint
 * 2. File opening endpoint
 *
 * Usage:
 *   npx locator-angular-server [options]
 *
 * Options:
 *   --port, -p      Server port (default: 4123)
 *   --editor, -e    Default editor (cursor, code, webstorm)
 *   --map, -m       Path to component map file (default: .locator/component-map.json)
 */
import http from "http";
interface ServerOptions {
    port?: number;
    editor?: string;
    mapPath?: string;
}
export declare function startServer(serverOptions?: ServerOptions): http.Server;
export {};
//# sourceMappingURL=server.d.ts.map