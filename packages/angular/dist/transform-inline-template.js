"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformInlineTemplate = transformInlineTemplate;
const transform_template_1 = require("./transform-template");
/**
 * Transforms inline templates in Angular .component.ts files.
 *
 * Detects @Component({ template: `...` }) or template: '...' patterns
 * and applies data-locatorjs attribute injection with correct line offsets.
 */
function transformInlineTemplate(source, filePath) {
    // Match template property in @Component decorator
    // Handles: template: `...`, template: '...', template: "..."
    const templateRegex = /template\s*:\s*(`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g;
    let result = source;
    let offset = 0;
    let match;
    while ((match = templateRegex.exec(source)) !== null) {
        const fullMatch = match[0];
        const templateLiteral = match[1];
        const quoteChar = templateLiteral[0];
        const templateContent = templateLiteral.slice(1, -1);
        // Only process if it looks like it's inside @Component
        // Simple heuristic: check if @Component appears before this match
        const beforeMatch = source.slice(0, match.index);
        const lastComponentDecoratorIndex = beforeMatch.lastIndexOf("@Component");
        if (lastComponentDecoratorIndex === -1) {
            continue;
        }
        // Ensure the @Component is not too far back (within ~2000 chars is reasonable)
        if (match.index - lastComponentDecoratorIndex > 2000) {
            continue;
        }
        // Calculate line offset: count newlines before the template content starts
        const templateContentStart = match.index + fullMatch.indexOf(templateLiteral) + 1;
        const beforeTemplate = source.slice(0, templateContentStart);
        const lineOffset = (beforeTemplate.match(/\n/g) || []).length;
        // Calculate column offset for the first line of the template
        const lastNewlineIndex = beforeTemplate.lastIndexOf("\n");
        const columnOffset = lastNewlineIndex === -1
            ? templateContentStart
            : templateContentStart - lastNewlineIndex - 1;
        // Unescape the template content if it's a regular string (not backtick)
        let actualContent = templateContent;
        if (quoteChar !== "`") {
            actualContent = templateContent
                .replace(/\\n/g, "\n")
                .replace(/\\'/g, "'")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");
        }
        const transformed = (0, transform_template_1.transformTemplate)(actualContent, {
            filePath,
            lineOffset,
            columnOffset,
        });
        // Re-escape if it was a regular string
        let finalContent = transformed;
        if (quoteChar !== "`") {
            finalContent = transformed
                .replace(/\\/g, "\\\\")
                .replace(/\n/g, "\\n")
                .replace(new RegExp(quoteChar, "g"), `\\${quoteChar}`);
        }
        const newTemplateLiteral = quoteChar + finalContent + quoteChar;
        const newFullMatch = fullMatch.replace(templateLiteral, newTemplateLiteral);
        const adjustedIndex = match.index + offset;
        result =
            result.slice(0, adjustedIndex) +
                newFullMatch +
                result.slice(adjustedIndex + fullMatch.length);
        offset += newFullMatch.length - fullMatch.length;
    }
    return result;
}
