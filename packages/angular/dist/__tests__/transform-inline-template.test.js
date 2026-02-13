"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const transform_inline_template_1 = require("../transform-inline-template");
(0, vitest_1.describe)("transformInlineTemplate", () => {
    const filePath = "/src/app/test.component.ts";
    (0, vitest_1.it)("should transform backtick inline template", () => {
        const input = `import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  template: \`<div>Hello</div>\`
})
export class TestComponent {}`;
        const result = (0, transform_inline_template_1.transformInlineTemplate)(input, filePath);
        (0, vitest_1.expect)(result).toContain("data-locatorjs=");
        (0, vitest_1.expect)(result).toContain(`<div data-locatorjs="${filePath}:`);
    });
    (0, vitest_1.it)("should not transform files without @Component", () => {
        const input = `const template = \`<div>Hello</div>\`;`;
        const result = (0, transform_inline_template_1.transformInlineTemplate)(input, filePath);
        (0, vitest_1.expect)(result).toBe(input);
    });
    (0, vitest_1.it)("should preserve non-template parts of the file", () => {
        const input = `import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  template: \`<div>Hello</div>\`
})
export class TestComponent {
  title = 'test';
}`;
        const result = (0, transform_inline_template_1.transformInlineTemplate)(input, filePath);
        (0, vitest_1.expect)(result).toContain("import { Component } from '@angular/core';");
        (0, vitest_1.expect)(result).toContain("export class TestComponent {");
        (0, vitest_1.expect)(result).toContain("title = 'test';");
    });
    (0, vitest_1.it)("should handle multiline inline templates", () => {
        const input = `@Component({
  template: \`
    <div>
      <span>Hello</span>
    </div>
  \`
})
export class TestComponent {}`;
        const result = (0, transform_inline_template_1.transformInlineTemplate)(input, filePath);
        (0, vitest_1.expect)(result).toContain("data-locatorjs=");
        // Should have attributes on both div and span
        const matches = result.match(/data-locatorjs/g) || [];
        (0, vitest_1.expect)(matches.length).toBe(2);
    });
    (0, vitest_1.it)("should not transform single-quoted template without @Component nearby", () => {
        // Template far from @Component (>2000 chars away)
        const padding = "// " + "x".repeat(2100) + "\n";
        const input = `@Component({
  selector: 'app-test',
  templateUrl: './test.html'
})
export class TestComponent {}
${padding}
const other = { template: '<div>not a component</div>' };`;
        const result = (0, transform_inline_template_1.transformInlineTemplate)(input, filePath);
        // The second template should not be transformed because it's too far from @Component
        (0, vitest_1.expect)(result).toContain("not a component");
    });
});
