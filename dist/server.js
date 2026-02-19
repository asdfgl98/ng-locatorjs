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
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import childProcess from "child_process";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EDITOR_SCHEMES = {
    cursor: "cursor://file/${filePath}:${line}:${column}",
    code: "vscode://file/${filePath}:${line}:${column}",
    webstorm: "webstorm://open?file=${filePath}&line=${line}&column=${column}",
    windsurf: "windsurf://file/${filePath}:${line}:${column}",
    antigravity: "antigravity://file/${filePath}:${line}:${column}",
};
let componentMap = {};
let options = {};
function loadComponentMap() {
    const mapPath = options.mapPath || ".locator/component-map.json";
    const absolutePath = path.resolve(process.cwd(), mapPath);
    try {
        if (fs.existsSync(absolutePath)) {
            const content = fs.readFileSync(absolutePath, "utf-8");
            componentMap = JSON.parse(content);
            console.log(`[@locator/angular-server] Loaded ${Object.keys(componentMap).length} components from ${mapPath}`);
        }
        else {
            console.warn(`[@locator/angular-server] Component map not found at ${mapPath}`);
            componentMap = {};
        }
    }
    catch (error) {
        console.error(`[@locator/angular-server] Failed to load component map:`, error);
        componentMap = {};
    }
}
function getEditorScheme(editor) {
    return EDITOR_SCHEMES[editor] || EDITOR_SCHEMES.cursor;
}
function openFile(filePath, line = 1, column = 1, overrideEditor) {
    const editor = overrideEditor || options.editor || "cursor";
    let absolutePath = path.resolve(process.cwd(), filePath);
    // Normalize Windows paths for URI schemes (replace \ with /)
    if (process.platform === "win32") {
        absolutePath = absolutePath.replace(/\\/g, "/");
    }
    const scheme = getEditorScheme(editor).replace("${filePath}", absolutePath).replace("${line}", String(line)).replace("${column}", String(column));
    console.log(`[@locator/angular-server] Opening (${editor}): ${scheme}`);
    try {
        const platform = process.platform;
        if (platform === "win32") {
            childProcess.exec(`start "" "${scheme}"`);
        }
        else if (platform === "darwin") {
            childProcess.exec(`open "${scheme}"`);
        }
        else {
            childProcess.exec(`xdg-open "${scheme}"`);
        }
        return true;
    }
    catch (error) {
        console.error(`[@locator/angular-server] Failed to open file:`, error);
        return false;
    }
}
function handleRequest(req, res) {
    const url = req.url || "/";
    const urlObj = new URL(url, `http://localhost:${options.port || 4123}`);
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }
    // Component map endpoint
    if (urlObj.pathname === "/__locator__/map") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(componentMap));
        return;
    }
    // Open file endpoint
    if (urlObj.pathname === "/__locator__/open") {
        const filePath = urlObj.searchParams.get("file");
        const line = parseInt(urlObj.searchParams.get("line") || "1", 10);
        const column = parseInt(urlObj.searchParams.get("column") || "1", 10);
        const editor = urlObj.searchParams.get("editor") || undefined;
        if (!filePath) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing file parameter" }));
            return;
        }
        const success = openFile(filePath, line, column, editor);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success }));
        return;
    }
    // Open by component name endpoint
    if (urlObj.pathname === "/__locator__/open-component") {
        const componentName = urlObj.searchParams.get("component");
        const line = parseInt(urlObj.searchParams.get("line") || "1", 10);
        const column = parseInt(urlObj.searchParams.get("column") || "1", 10);
        const editor = urlObj.searchParams.get("editor") || undefined;
        if (!componentName) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing component parameter" }));
            return;
        }
        const componentInfo = componentMap[componentName];
        if (!componentInfo) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: `Component not found: ${componentName}` }));
            return;
        }
        const success = openFile(componentInfo.filePath, line, column, editor);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success, filePath: componentInfo.filePath }));
        return;
    }
    // Health check
    if (urlObj.pathname === "/__locator__/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", components: Object.keys(componentMap).length }));
        return;
    }
    // Reload map
    if (urlObj.pathname === "/__locator__/reload") {
        loadComponentMap();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "reloaded", components: Object.keys(componentMap).length }));
        return;
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
}
export function startServer(serverOptions = {}) {
    options = serverOptions;
    const port = options.port || 4123;
    loadComponentMap();
    const server = http.createServer(handleRequest);
    server.listen(port, () => {
        console.log(`[@locator/angular-server] Server running on http://localhost:${port}`);
        console.log(`[@locator/angular-server] Endpoints:`);
        console.log(`  GET /__locator__/map - Get component map`);
        console.log(`  GET /__locator__/open?file=<path>&line=<n>&column=<n> - Open file in editor`);
        console.log(`  GET /__locator__/open-component?component=<name> - Open component file`);
        console.log(`  GET /__locator__/reload - Reload component map`);
    });
    // Watch for component map changes
    const mapPath = options.mapPath || ".locator/component-map.json";
    const absoluteMapPath = path.resolve(process.cwd(), mapPath);
    let debounceTimer = null;
    const mapDir = path.dirname(absoluteMapPath);
    if (fs.existsSync(mapDir)) {
        fs.watch(mapDir, (eventType, filename) => {
            if (filename === path.basename(absoluteMapPath)) {
                if (debounceTimer)
                    clearTimeout(debounceTimer);
                debounceTimer = setTimeout(loadComponentMap, 300);
            }
        });
    }
    return server;
}
// CLI entry point
const args = process.argv.slice(2);
const serverOptions = {};
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--port" || arg === "-p") {
        serverOptions.port = parseInt(args[++i], 10);
    }
    else if (arg === "--editor" || arg === "-e") {
        serverOptions.editor = args[++i];
    }
    else if (arg === "--map" || arg === "-m") {
        serverOptions.mapPath = args[++i];
    }
}
startServer(serverOptions);
//# sourceMappingURL=server.js.map