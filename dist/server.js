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
import fs from "fs";
import path from "path";
import childProcess from "child_process";
const EDITOR_SCHEMES = {
    cursor: "cursor://file/${filePath}:${line}:${column}",
    code: "vscode://file/${filePath}:${line}:${column}",
    webstorm: "webstorm://open?file=${filePath}&line=${line}&column=${column}",
    windsurf: "windsurf://file/${filePath}:${line}:${column}",
    antigravity: "antigravity://file/${filePath}:${line}:${column}",
};
const DEFAULT_SCAN_CONFIG = {
    include: [
        "src/**/*.ts",
        "apps/**/*.ts",
        "libs/**/*.ts",
    ],
    exclude: ["node_modules", "dist", ".git", "coverage"],
    output: ".locator/component-map.json",
};
function loadScanConfig(configPath, overrides) {
    let config;
    if (!fs.existsSync(configPath)) {
        config = { ...DEFAULT_SCAN_CONFIG };
    }
    else {
        try {
            const content = fs.readFileSync(configPath, "utf-8");
            const userConfig = JSON.parse(content);
            config = { ...DEFAULT_SCAN_CONFIG, ...userConfig };
        }
        catch {
            config = { ...DEFAULT_SCAN_CONFIG };
        }
    }
    // Merge CLI/programmatic overrides (append, not replace)
    if (overrides?.include?.length) {
        config.include = [...(config.include || []), ...overrides.include];
    }
    if (overrides?.exclude?.length) {
        config.exclude = [...(config.exclude || []), ...overrides.exclude];
    }
    return config;
}
function matchGlob(filename, pattern) {
    const regexStr = pattern
        .replace(/\./g, "\\.")
        .replace(/\*\*/g, "<<DOUBLE_STAR>>")
        .replace(/\*/g, "[^/]*")
        .replace(/<<DOUBLE_STAR>>/g, ".*")
        .replace(/\?/g, "[^/]");
    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(filename);
}
function findFiles(projectRoot, config) {
    const files = [];
    const excludePatterns = config.exclude || [];
    function scan(dir) {
        if (!fs.existsSync(dir))
            return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (excludePatterns.some((ex) => entry.name.includes(ex) || fullPath.includes(ex))) {
                    continue;
                }
                scan(fullPath);
            }
            else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".spec.ts")) {
                const relativePath = path.relative(projectRoot, fullPath).replace(/\\/g, "/");
                for (const pattern of config.include || []) {
                    if (matchGlob(relativePath, pattern)) {
                        files.push(fullPath);
                        break;
                    }
                }
            }
        }
    }
    scan(projectRoot);
    return files;
}
function resolveTemplateFilePath(filePath, content, projectRoot) {
    const templateUrlMatch = content.match(/templateUrl\s*:\s*['"`](.*?)['"`]/);
    if (templateUrlMatch) {
        const templateUrl = templateUrlMatch[1];
        const dir = path.dirname(filePath);
        const absoluteTemplatePath = path.resolve(dir, templateUrl);
        if (fs.existsSync(absoluteTemplatePath)) {
            return path.relative(projectRoot, absoluteTemplatePath).replace(/\\/g, "/");
        }
    }
    const inlineTemplateMatch = content.match(/template\s*:\s*[`'"]/);
    if (inlineTemplateMatch) {
        return path.relative(projectRoot, filePath).replace(/\\/g, "/");
    }
    return null;
}
function scanComponents(projectRoot, config) {
    const files = findFiles(projectRoot, config);
    const map = {};
    for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        const relativePath = path.relative(projectRoot, file).replace(/\\/g, "/");
        const templateFilePath = resolveTemplateFilePath(file, content, projectRoot);
        const componentMatches = content.matchAll(/@Component\s*\(\s*\{[\s\S]*?selector\s*:\s*['"`](.*?)['"`][\s\S]*?\}\s*\)\s*(?:\n|\s)*export\s+(?:default\s+)?class\s+(\w+)/g);
        for (const match of componentMatches) {
            const entry = {
                filePath: relativePath,
                selector: match[1],
                templateFilePath,
            };
            map[match[2]] = entry;
            map[`_${match[2]}`] = entry;
        }
        // Fallback: class name pattern
        if (!content.match(/@Component/))
            continue;
        const classMatches = content.matchAll(/export\s+(?:default\s+)?class\s+(\w+(?:Component|Page|Modal|Dialog|Panel))/g);
        for (const match of classMatches) {
            if (map[match[1]])
                continue; // Already found via @Component
            const selectorMatch = content.match(/selector\s*:\s*['"`](.*?)['"`]/);
            const entry = {
                filePath: relativePath,
                selector: selectorMatch ? selectorMatch[1] : null,
                templateFilePath,
            };
            map[match[1]] = entry;
            map[`_${match[1]}`] = entry;
        }
    }
    return map;
}
// ─── Server Logic ────────────────────────────────────────────────────────────
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
/**
 * Run scan and save component map to disk
 */
function runScan() {
    const projectRoot = process.cwd();
    const configPath = path.resolve(projectRoot, options.configPath || "locator.config.json");
    const config = loadScanConfig(configPath, options.scanConfig);
    const mapPath = options.mapPath || config.output || ".locator/component-map.json";
    const absoluteMapPath = path.resolve(projectRoot, mapPath);
    console.log(`[@locator/angular-server] Scanning components...`);
    componentMap = scanComponents(projectRoot, config);
    const count = Object.keys(componentMap).length;
    console.log(`[@locator/angular-server] Found ${count} components`);
    // Save to disk
    const outputDir = path.dirname(absoluteMapPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(absoluteMapPath, JSON.stringify(componentMap, null, 2));
    console.log(`[@locator/angular-server] Component map saved to ${mapPath}`);
}
/**
 * Start watching source directories for changes and auto-rescan
 */
function startFileWatcher() {
    const projectRoot = process.cwd();
    const configPath = path.resolve(projectRoot, options.configPath || "locator.config.json");
    const config = loadScanConfig(configPath, options.scanConfig);
    let debounceTimer = null;
    const watchDirs = new Set();
    for (const pattern of config.include || []) {
        const parts = pattern.split("/");
        if (parts[0] && !parts[0].includes("*")) {
            const dir = path.join(projectRoot, parts[0]);
            if (fs.existsSync(dir)) {
                watchDirs.add(dir);
            }
        }
    }
    if (watchDirs.size === 0) {
        watchDirs.add(projectRoot);
    }
    for (const dir of watchDirs) {
        fs.watch(dir, { recursive: true }, (eventType, filename) => {
            if (filename && (filename.endsWith(".ts") || filename.endsWith(".html")) && !filename.endsWith(".spec.ts")) {
                if (debounceTimer)
                    clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    console.log(`[@locator/angular-server] File changed: ${filename}, rescanning...`);
                    runScan();
                }, 500);
            }
        });
    }
    console.log(`[@locator/angular-server] Watching directories: ${Array.from(watchDirs).join(", ")}`);
}
function getEditorScheme(editor) {
    return EDITOR_SCHEMES[editor] || EDITOR_SCHEMES.cursor;
}
/**
 * Find the line number of a tag in a template file.
 * Reads the file at request time so changes are always reflected.
 */
function findTagLine(templateRelativePath, tagName) {
    const absolutePath = path.resolve(process.cwd(), templateRelativePath);
    try {
        if (!fs.existsSync(absolutePath)) {
            return null;
        }
        const content = fs.readFileSync(absolutePath, "utf-8");
        const lines = content.split(/\r?\n/);
        // For inline templates in .ts files, find the template start offset
        let templateStartLine = 0;
        if (absolutePath.endsWith(".ts")) {
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].match(/template\s*:\s*[`'"]/)) {
                    templateStartLine = i + 1; // Next line is typically where template content starts
                    break;
                }
            }
        }
        // Search for the tag in template content
        // Use regex to match exact tag name (e.g. <p> should not match <path>)
        const tagRegex = new RegExp(`<${tagName}(?=[\\s>/])`, "i");
        for (let i = templateStartLine; i < lines.length; i++) {
            const match = tagRegex.exec(lines[i]);
            if (match) {
                return { line: i + 1, column: match.index + 1 };
            }
        }
    }
    catch {
        // File read failed
    }
    return null;
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
        const tag = urlObj.searchParams.get("tag") || undefined;
        if (!filePath) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing file parameter" }));
            return;
        }
        // If tag is provided, try to find it in the file
        if (tag) {
            const tagPos = findTagLine(filePath, tag);
            if (tagPos) {
                const success = openFile(filePath, tagPos.line, tagPos.column, editor);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success, line: tagPos.line, column: tagPos.column }));
                return;
            }
        }
        const success = openFile(filePath, line, column, editor);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success }));
        return;
    }
    // Open by component name endpoint (with tag line detection)
    if (urlObj.pathname === "/__locator__/open-component") {
        const componentName = urlObj.searchParams.get("component");
        const tag = urlObj.searchParams.get("tag") || undefined;
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
        // If tag is provided and template file exists, find the tag line in template
        if (tag && componentInfo.templateFilePath) {
            const tagPos = findTagLine(componentInfo.templateFilePath, tag);
            if (tagPos) {
                const success = openFile(componentInfo.templateFilePath, tagPos.line, tagPos.column, editor);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    success,
                    filePath: componentInfo.templateFilePath,
                    line: tagPos.line,
                    column: tagPos.column,
                    tag,
                }));
                return;
            }
        }
        // Fallback: open .ts file
        const success = openFile(componentInfo.filePath, 1, 1, editor);
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
    // Reload / rescan
    if (urlObj.pathname === "/__locator__/reload") {
        if (options.watch) {
            runScan();
        }
        else {
            loadComponentMap();
        }
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
    if (options.watch) {
        // Watch mode: server handles scanning internally
        runScan();
        startFileWatcher();
    }
    else {
        // Normal mode: load from component-map.json file
        loadComponentMap();
        // Watch for component map file changes
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
    }
    const server = http.createServer(handleRequest);
    server.listen(port, () => {
        console.log(`[@locator/angular-server] Server running on http://localhost:${port}`);
        console.log(`[@locator/angular-server] Mode: ${options.watch ? "watch (auto-scan)" : "normal"}`);
        console.log(`[@locator/angular-server] Endpoints:`);
        console.log(`  GET /__locator__/map - Get component map`);
        console.log(`  GET /__locator__/open?file=<path>&line=<n>&column=<n> - Open file in editor`);
        console.log(`  GET /__locator__/open-component?component=<name>&tag=<tag> - Open component template at tag line`);
        console.log(`  GET /__locator__/reload - Reload / rescan component map`);
    });
    return server;
}
// CLI entry point
const args = process.argv.slice(2);
const serverOptions = {};
const cliInclude = [];
const cliExclude = [];
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
    else if (arg === "--watch" || arg === "-w") {
        serverOptions.watch = true;
    }
    else if (arg === "--config" || arg === "-c") {
        serverOptions.configPath = args[++i];
    }
    else if (arg === "--include" || arg === "-i") {
        cliInclude.push(args[++i]);
    }
    else if (arg === "--exclude" || arg === "-x") {
        cliExclude.push(args[++i]);
    }
}
if (cliInclude.length || cliExclude.length) {
    serverOptions.scanConfig = {
        ...(cliInclude.length ? { include: cliInclude } : {}),
        ...(cliExclude.length ? { exclude: cliExclude } : {}),
    };
}
startServer(serverOptions);
//# sourceMappingURL=server.js.map