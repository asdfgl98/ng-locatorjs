"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const transform_template_1 = require("../transform-template");
(0, vitest_1.describe)("transformTemplate", () => {
    const filePath = "/src/app/test.component.html";
    (0, vitest_1.it)("should inject data-locatorjs into simple HTML tags", () => {
        const input = `<div>Hello</div>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        (0, vitest_1.expect)(result).toBe(`<div data-locatorjs="${filePath}:1:0">Hello</div>`);
    });
    (0, vitest_1.it)("should handle multiple tags", () => {
        const input = `<div><span>text</span></div>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        (0, vitest_1.expect)(result).toContain(`<div data-locatorjs="${filePath}:1:0">`);
        (0, vitest_1.expect)(result).toContain(`<span data-locatorjs="${filePath}:1:5">`);
    });
    (0, vitest_1.it)("should handle tags with existing attributes", () => {
        const input = `<div class="foo">Hello</div>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        (0, vitest_1.expect)(result).toBe(`<div data-locatorjs="${filePath}:1:0" class="foo">Hello</div>`);
    });
    (0, vitest_1.it)("should handle multiline templates", () => {
        const input = `<div>
  <p>Hello</p>
</div>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        (0, vitest_1.expect)(result).toContain(`<div data-locatorjs="${filePath}:1:0">`);
        (0, vitest_1.expect)(result).toContain(`<p data-locatorjs="${filePath}:2:2">`);
    });
    (0, vitest_1.it)("should skip ng-container", () => {
        const input = `<ng-container><div>Hello</div></ng-container>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        (0, vitest_1.expect)(result).not.toContain("ng-container data-locatorjs");
        (0, vitest_1.expect)(result).toContain(`<div data-locatorjs="${filePath}:1:14">`);
    });
    (0, vitest_1.it)("should skip ng-template", () => {
        const input = `<ng-template><div>Hello</div></ng-template>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        (0, vitest_1.expect)(result).not.toContain("ng-template data-locatorjs");
        (0, vitest_1.expect)(result).toContain(`<div data-locatorjs="${filePath}:1:13">`);
    });
    (0, vitest_1.it)("should skip ng-content", () => {
        const input = `<ng-content></ng-content>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        (0, vitest_1.expect)(result).not.toContain("data-locatorjs");
    });
    (0, vitest_1.it)("should handle Angular component selectors (hyphenated)", () => {
        const input = `<app-header></app-header>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        (0, vitest_1.expect)(result).toBe(`<app-header data-locatorjs="${filePath}:1:0"></app-header>`);
    });
    (0, vitest_1.it)("should handle Angular binding syntax", () => {
        const input = `<div [class.active]="isActive" (click)="onClick()">text</div>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        (0, vitest_1.expect)(result).toContain(`<div data-locatorjs="${filePath}:1:0"`);
    });
    (0, vitest_1.it)("should handle Angular structural directives", () => {
        const input = `<div *ngIf="show">text</div>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        (0, vitest_1.expect)(result).toContain(`<div data-locatorjs="${filePath}:1:0"`);
    });
    (0, vitest_1.it)("should handle Angular 17+ control flow (@ syntax)", () => {
        const input = `@if (show) {
  <div>visible</div>
}`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        // @if is not an HTML tag, should not get attribute
        (0, vitest_1.expect)(result).not.toContain("@if data-locatorjs");
        (0, vitest_1.expect)(result).toContain(`<div data-locatorjs="${filePath}:2:2">`);
    });
    (0, vitest_1.it)("should not inject into HTML comments", () => {
        const input = `<!-- <div>commented out</div> --><p>real</p>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        // The <div> inside comment should not get data-locatorjs
        // Only <p> should get it
        const dataLocatorCount = (result.match(/data-locatorjs/g) || []).length;
        (0, vitest_1.expect)(dataLocatorCount).toBe(1);
        (0, vitest_1.expect)(result).toContain(`<p data-locatorjs="${filePath}:1:33">`);
    });
    (0, vitest_1.it)("should apply lineOffset for inline templates", () => {
        const input = `<div>Hello</div>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath, lineOffset: 10 });
        (0, vitest_1.expect)(result).toBe(`<div data-locatorjs="${filePath}:11:0">Hello</div>`);
    });
    (0, vitest_1.it)("should apply columnOffset for first line of inline templates", () => {
        const input = `<div>Hello</div>`;
        const result = (0, transform_template_1.transformTemplate)(input, {
            filePath,
            lineOffset: 10,
            columnOffset: 5,
        });
        (0, vitest_1.expect)(result).toBe(`<div data-locatorjs="${filePath}:11:5">Hello</div>`);
    });
    (0, vitest_1.it)("should return unchanged template if no tags found", () => {
        const input = `Just some text {{ interpolation }}`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        (0, vitest_1.expect)(result).toBe(input);
    });
    (0, vitest_1.it)("should handle self-closing tags", () => {
        const input = `<img src="test.png" /><br/>`;
        const result = (0, transform_template_1.transformTemplate)(input, { filePath });
        (0, vitest_1.expect)(result).toContain(`<img data-locatorjs="${filePath}:1:0"`);
        (0, vitest_1.expect)(result).toContain(`<br data-locatorjs="${filePath}:1:22"`);
    });
});
