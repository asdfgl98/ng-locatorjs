#!/usr/bin/env node
/**
 * CLI tool to scan Angular components and generate a component map.
 *
 * Usage:
 *   npx locator-angular-scan [options]
 *
 * Options:
 *   --output, -o    Output file path (default: .locator/component-map.json)
 *   --config, -c    Config file path (default: locator.config.json)
 *   --watch, -w     Watch for file changes
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_CONFIG = {
    include: [
        "src/**/*.ts",
        "apps/**/*.ts",
        "libs/**/*.ts",
    ],
    exclude: ["node_modules", "dist", ".git", "coverage"],
    output: ".locator/component-map.json",
};
function loadConfig(configPath) {
    if (!fs.existsSync(configPath)) {
        return DEFAULT_CONFIG;
    }
    try {
        const content = fs.readFileSync(configPath, "utf-8");
        const userConfig = JSON.parse(content);
        return { ...DEFAULT_CONFIG, ...userConfig };
    }
    catch (e) {
        console.warn(`[@locator/angular] Failed to load config from ${configPath}, using defaults`);
        return DEFAULT_CONFIG;
    }
}
function matchGlob(filename, pattern) {
    // Convert glob pattern to regex
    // Order matters: escape dots first, then handle **, then *
    const regexStr = pattern
        .replace(/\./g, "\\.") // Escape dots first
        .replace(/\*\*/g, "<<DOUBLE_STAR>>") // Temporarily replace **
        .replace(/\*/g, "[^/]*") // Replace single * with [^/]*
        .replace(/<<DOUBLE_STAR>>/g, ".*") // Replace ** with .*
        .replace(/\?/g, "[^/]"); // Replace ? with [^/]
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
                // Skip excluded directories
                if (excludePatterns.some((ex) => entry.name.includes(ex) || fullPath.includes(ex))) {
                    continue;
                }
                scan(fullPath);
            }
            else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".spec.ts")) {
                const relativePath = path.relative(projectRoot, fullPath).replace(/\\/g, "/");
                // Check if file matches any include pattern
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
    // 1. Check for templateUrl
    const templateUrlMatch = content.match(/templateUrl\s*:\s*['"`](.*?)['"`]/);
    if (templateUrlMatch) {
        const templateUrl = templateUrlMatch[1];
        const dir = path.dirname(filePath);
        const absoluteTemplatePath = path.resolve(dir, templateUrl);
        if (fs.existsSync(absoluteTemplatePath)) {
            return path.relative(projectRoot, absoluteTemplatePath).replace(/\\/g, "/");
        }
    }
    // 2. Check for inline template (template: `...` or template: '...')
    const inlineTemplateMatch = content.match(/template\s*:\s*[`'"]/);
    if (inlineTemplateMatch) {
        // Inline template: use the .ts file itself
        return path.relative(projectRoot, filePath).replace(/\\/g, "/");
    }
    return null;
}
function extractComponentInfo(filePath, projectRoot) {
    const content = fs.readFileSync(filePath, "utf-8");
    const components = [];
    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, "/");
    const templateFilePath = resolveTemplateFilePath(filePath, content, projectRoot);
    // Find @Component decorators with selector and class name
    // Supports both 'export class' and 'export default class'
    const componentMatches = content.matchAll(/@Component\s*\(\s*\{[\s\S]*?selector\s*:\s*['"`](.*?)['"`][\s\S]*?\}\s*\)\s*(?:\n|\s)*export\s+(?:default\s+)?class\s+(\w+)/g);
    for (const match of componentMatches) {
        const selector = match[1];
        const className = match[2];
        components.push({
            className,
            filePath: relativePath,
            selector,
            templateFilePath,
        });
    }
    // If no @Component found, try to find classes with naming patterns
    if (components.length === 0) {
        // Look for classes ending with Component, Page, Modal, Dialog, Panel
        // Supports both 'export class' and 'export default class'
        const classMatches = content.matchAll(/export\s+(?:default\s+)?class\s+(\w+(?:Component|Page|Modal|Dialog|Panel))/g);
        for (const match of classMatches) {
            const className = match[1];
            // Try to find selector in the file
            const selectorMatch = content.match(/selector\s*:\s*['"`](.*?)['"`]/);
            const selector = selectorMatch ? selectorMatch[1] : null;
            components.push({
                className,
                filePath: relativePath,
                selector,
                templateFilePath,
            });
        }
    }
    return components;
}
function generateComponentMap(projectRoot, config) {
    const files = findFiles(projectRoot, config);
    const map = {};
    for (const file of files) {
        const components = extractComponentInfo(file, projectRoot);
        for (const comp of components) {
            const entry = {
                filePath: comp.filePath,
                selector: comp.selector,
                templateFilePath: comp.templateFilePath,
            };
            // Add original name
            map[comp.className] = entry;
            // Also add with underscore prefix (Angular adds this in some cases)
            map[`_${comp.className}`] = entry;
        }
    }
    return map;
}
function main() {
    const args = process.argv.slice(2);
    let configPath = "locator.config.json";
    let outputPath = null;
    let shouldWatch = false;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--config" || arg === "-c") {
            configPath = args[++i];
        }
        else if (arg === "--output" || arg === "-o") {
            outputPath = args[++i];
        }
        else if (arg === "--watch" || arg === "-w") {
            shouldWatch = true;
        }
    }
    const projectRoot = process.cwd();
    const absoluteConfigPath = path.resolve(projectRoot, configPath);
    const config = loadConfig(absoluteConfigPath);
    const finalOutputPath = outputPath || config.output || ".locator/component-map.json";
    const absoluteOutputPath = path.resolve(projectRoot, finalOutputPath);
    function scan() {
        console.log(`[@locator/angular] Scanning project...`);
        console.log(`[@locator/angular] Include patterns: ${config.include?.join(", ")}`);
        const map = generateComponentMap(projectRoot, config);
        const count = Object.keys(map).length;
        console.log(`[@locator/angular] Found ${count} components`);
        // Ensure output directory exists
        const outputDir = path.dirname(absoluteOutputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(absoluteOutputPath, JSON.stringify(map, null, 2));
        console.log(`[@locator/angular] Component map saved to ${finalOutputPath}`);
    }
    scan();
    if (shouldWatch) {
        console.log(`[@locator/angular] Watching for changes...`);
        let debounceTimer = null;
        // Watch all directories in include patterns
        const watchDirs = new Set();
        for (const pattern of config.include || []) {
            const parts = pattern.split("/");
            if (parts[0] && !parts[0].includes("*")) {
                watchDirs.add(path.join(projectRoot, parts[0]));
            }
        }
        // Always watch project root if no specific dirs found
        if (watchDirs.size === 0) {
            watchDirs.add(projectRoot);
        }
        for (const dir of watchDirs) {
            if (fs.existsSync(dir)) {
                fs.watch(dir, { recursive: true }, (eventType, filename) => {
                    if (filename && filename.endsWith(".ts") && !filename.endsWith(".spec.ts")) {
                        if (debounceTimer)
                            clearTimeout(debounceTimer);
                        debounceTimer = setTimeout(scan, 300);
                    }
                });
            }
        }
        console.log(`[@locator/angular] Watching directories: ${Array.from(watchDirs).join(", ")}`);
    }
}
main();
//# sourceMappingURL=cli.js.map