import { findOpeningTags } from "./utils/html-parser";

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
export function transformTemplate(
  template: string,
  options: TransformTemplateOptions
): string {
  const { filePath, lineOffset = 0, columnOffset = 0 } = options;

  const tags = findOpeningTags(template);

  if (tags.length === 0) {
    return template;
  }

  // Build result by inserting attributes, working backwards to preserve indices
  let result = template;

  for (let i = tags.length - 1; i >= 0; i--) {
    const tag = tags[i];

    // Calculate actual line/column considering offsets
    let actualLine = tag.line + lineOffset;
    let actualColumn = tag.column;

    // Only apply column offset for the first line of inline templates
    if (tag.line === 1 && columnOffset > 0) {
      actualColumn += columnOffset;
    }

    const attrValue = `${filePath}:${actualLine}:${actualColumn}`;
    const attr = ` data-locatorjs="${attrValue}"`;

    // Insert attribute right after the tag name
    result =
      result.slice(0, tag.afterTagNameIndex) +
      attr +
      result.slice(tag.afterTagNameIndex);
  }

  return result;
}
