export interface TransformTemplateOptions {
    /** Absolute file path of the template */
    filePath: string;
    /** Line offset for inline templates (0 for external .html files) */
    lineOffset?: number;
    /** Column offset for the first line of inline templates */
    columnOffset?: number;
}
/**
 * Transforms an Angular HTML template by injecting `data-locatorjs` attributes
 * into all opening HTML tags.
 *
 * The attribute format is: data-locatorjs="filePath:line:column"
 * This matches the format used by the JSX adapter's parseDataPath().
 *
 * @param template - The HTML template string
 * @param options - Transform options including file path and offsets
 * @returns The transformed template string
 */
export declare function transformTemplate(template: string, options: TransformTemplateOptions): string;
//# sourceMappingURL=transform-template.d.ts.map