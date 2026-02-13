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

// Tags that don't produce real DOM elements
const SKIP_TAGS = new Set([
  "ng-container",
  "ng-template",
  "ng-content",
]);

// Void (self-closing) HTML elements
const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/**
 * Find all opening HTML tags in a template string.
 * Skips Angular structural tags that don't produce DOM elements.
 */
export function findOpeningTags(template: string): TagMatch[] {
  const results: TagMatch[] = [];

  // Precompute line start offsets for fast line/column calculation
  const lineStarts = [0];
  for (let i = 0; i < template.length; i++) {
    if (template[i] === "\n") {
      lineStarts.push(i + 1);
    }
  }

  function getLineAndColumn(index: number): { line: number; column: number } {
    // Binary search for the line
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= index) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return { line: lo + 1, column: index - lineStarts[lo] };
  }

  // Match opening tags: < followed by a letter or hyphenated component name
  // This regex captures the tag name portion
  const tagRegex = /<([a-zA-Z][a-zA-Z0-9-]*)/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(template)) !== null) {
    const tagName = match[1].toLowerCase();

    // Skip closing tags (handled by not matching </), comments, doctype
    // Skip Angular structural tags
    if (SKIP_TAGS.has(tagName)) {
      continue;
    }

    // Check we're not inside an HTML comment <!-- ... -->
    if (isInsideComment(template, match.index)) {
      continue;
    }

    const { line, column } = getLineAndColumn(match.index);

    results.push({
      fullMatch: match[0],
      tagName,
      startIndex: match.index,
      afterTagNameIndex: match.index + match[0].length,
      line,
      column,
    });
  }

  return results;
}

/**
 * Check if an index is inside an HTML comment.
 */
function isInsideComment(template: string, index: number): boolean {
  let i = 0;
  while (i < index) {
    const commentStart = template.indexOf("<!--", i);
    if (commentStart === -1 || commentStart >= index) {
      return false;
    }
    const commentEnd = template.indexOf("-->", commentStart + 4);
    if (commentEnd === -1 || commentEnd + 3 > index) {
      return index > commentStart;
    }
    i = commentEnd + 3;
  }
  return false;
}

export { SKIP_TAGS, VOID_ELEMENTS };
