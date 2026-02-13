/**
 * Transforms inline templates in Angular .component.ts files.
 *
 * Detects @Component({ template: `...` }) or template: '...' patterns
 * and applies data-locatorjs attribute injection with correct line offsets.
 */
export declare function transformInlineTemplate(source: string, filePath: string): string;
//# sourceMappingURL=transform-inline-template.d.ts.map