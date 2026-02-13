/**
 * Regex-based HTML tag parser for Angular templates.
 *
 * We use regex instead of a standard HTML parser because Angular templates
 * contain non-standard syntax (*ngIf, [binding], (event), @if, etc.)
 * that breaks standard HTML parsers.
 */
export interface TagMatch {
    /** Full match string (e.g. "<div class=\"foo\"") */
    fullMatch: string;
    /** Tag name (e.g. "div", "app-header") */
    tagName: string;
    /** Start index of the match in the source string */
    startIndex: number;
    /** Index right after the tag name, before attributes */
    afterTagNameIndex: number;
    /** Line number (1-based) */
    line: number;
    /** Column number (0-based) */
    column: number;
}
declare const SKIP_TAGS: Set<string>;
declare const VOID_ELEMENTS: Set<string>;
/**
 * Find all opening HTML tags in a template string.
 * Skips Angular structural tags that don't produce DOM elements.
 */
export declare function findOpeningTags(template: string): TagMatch[];
export { SKIP_TAGS, VOID_ELEMENTS };
//# sourceMappingURL=html-parser.d.ts.map