import { describe, it, expect } from "vitest";
import { transformInlineTemplate } from "../transform-inline-template";

describe("transformInlineTemplate", () => {
  const filePath = "/src/app/test.component.ts";

  it("should transform backtick inline template", () => {
    const input = `import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  template: \`<div>Hello</div>\`
})
export class TestComponent {}`;

    const result = transformInlineTemplate(input, filePath);
    expect(result).toContain("data-locatorjs=");
    expect(result).toContain(`<div data-locatorjs="${filePath}:`);
  });

  it("should not transform files without @Component", () => {
    const input = `const template = \`<div>Hello</div>\`;`;
    const result = transformInlineTemplate(input, filePath);
    expect(result).toBe(input);
  });

  it("should preserve non-template parts of the file", () => {
    const input = `import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  template: \`<div>Hello</div>\`
})
export class TestComponent {
  title = 'test';
}`;

    const result = transformInlineTemplate(input, filePath);
    expect(result).toContain("import { Component } from '@angular/core';");
    expect(result).toContain("export class TestComponent {");
    expect(result).toContain("title = 'test';");
  });

  it("should handle multiline inline templates", () => {
    const input = `@Component({
  template: \`
    <div>
      <span>Hello</span>
    </div>
  \`
})
export class TestComponent {}`;

    const result = transformInlineTemplate(input, filePath);
    expect(result).toContain("data-locatorjs=");
    // Should have attributes on both div and span
    const matches = result.match(/data-locatorjs/g) || [];
    expect(matches.length).toBe(2);
  });

  it("should not transform single-quoted template without @Component nearby", () => {
    // Template far from @Component (>2000 chars away)
    const padding = "// " + "x".repeat(2100) + "\n";
    const input = `@Component({
  selector: 'app-test',
  templateUrl: './test.html'
})
export class TestComponent {}
${padding}
const other = { template: '<div>not a component</div>' };`;

    const result = transformInlineTemplate(input, filePath);
    // The second template should not be transformed because it's too far from @Component
    expect(result).toContain("not a component");
  });
});
