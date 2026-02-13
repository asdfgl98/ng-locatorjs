import { describe, it, expect } from "vitest";
import { transformTemplate } from "../transform-template";

describe("transformTemplate", () => {
  const filePath = "/src/app/test.component.html";

  it("should inject data-locatorjs into simple HTML tags", () => {
    const input = `<div>Hello</div>`;
    const result = transformTemplate(input, { filePath });
    expect(result).toBe(
      `<div data-locatorjs="${filePath}:1:0">Hello</div>`
    );
  });

  it("should handle multiple tags", () => {
    const input = `<div><span>text</span></div>`;
    const result = transformTemplate(input, { filePath });
    expect(result).toContain(`<div data-locatorjs="${filePath}:1:0">`);
    expect(result).toContain(`<span data-locatorjs="${filePath}:1:5">`);
  });

  it("should handle tags with existing attributes", () => {
    const input = `<div class="foo">Hello</div>`;
    const result = transformTemplate(input, { filePath });
    expect(result).toBe(
      `<div data-locatorjs="${filePath}:1:0" class="foo">Hello</div>`
    );
  });

  it("should handle multiline templates", () => {
    const input = `<div>
  <p>Hello</p>
</div>`;
    const result = transformTemplate(input, { filePath });
    expect(result).toContain(`<div data-locatorjs="${filePath}:1:0">`);
    expect(result).toContain(`<p data-locatorjs="${filePath}:2:2">`);
  });

  it("should skip ng-container", () => {
    const input = `<ng-container><div>Hello</div></ng-container>`;
    const result = transformTemplate(input, { filePath });
    expect(result).not.toContain("ng-container data-locatorjs");
    expect(result).toContain(`<div data-locatorjs="${filePath}:1:14">`);
  });

  it("should skip ng-template", () => {
    const input = `<ng-template><div>Hello</div></ng-template>`;
    const result = transformTemplate(input, { filePath });
    expect(result).not.toContain("ng-template data-locatorjs");
    expect(result).toContain(`<div data-locatorjs="${filePath}:1:13">`);
  });

  it("should skip ng-content", () => {
    const input = `<ng-content></ng-content>`;
    const result = transformTemplate(input, { filePath });
    expect(result).not.toContain("data-locatorjs");
  });

  it("should handle Angular component selectors (hyphenated)", () => {
    const input = `<app-header></app-header>`;
    const result = transformTemplate(input, { filePath });
    expect(result).toBe(
      `<app-header data-locatorjs="${filePath}:1:0"></app-header>`
    );
  });

  it("should handle Angular binding syntax", () => {
    const input = `<div [class.active]="isActive" (click)="onClick()">text</div>`;
    const result = transformTemplate(input, { filePath });
    expect(result).toContain(`<div data-locatorjs="${filePath}:1:0"`);
  });

  it("should handle Angular structural directives", () => {
    const input = `<div *ngIf="show">text</div>`;
    const result = transformTemplate(input, { filePath });
    expect(result).toContain(`<div data-locatorjs="${filePath}:1:0"`);
  });

  it("should handle Angular 17+ control flow (@ syntax)", () => {
    const input = `@if (show) {
  <div>visible</div>
}`;
    const result = transformTemplate(input, { filePath });
    // @if is not an HTML tag, should not get attribute
    expect(result).not.toContain("@if data-locatorjs");
    expect(result).toContain(`<div data-locatorjs="${filePath}:2:2">`);
  });

  it("should not inject into HTML comments", () => {
    const input = `<!-- <div>commented out</div> --><p>real</p>`;
    const result = transformTemplate(input, { filePath });
    // The <div> inside comment should not get data-locatorjs
    // Only <p> should get it
    const dataLocatorCount = (result.match(/data-locatorjs/g) || []).length;
    expect(dataLocatorCount).toBe(1);
    expect(result).toContain(`<p data-locatorjs="${filePath}:1:33">`);
  });

  it("should apply lineOffset for inline templates", () => {
    const input = `<div>Hello</div>`;
    const result = transformTemplate(input, { filePath, lineOffset: 10 });
    expect(result).toBe(
      `<div data-locatorjs="${filePath}:11:0">Hello</div>`
    );
  });

  it("should apply columnOffset for first line of inline templates", () => {
    const input = `<div>Hello</div>`;
    const result = transformTemplate(input, {
      filePath,
      lineOffset: 10,
      columnOffset: 5,
    });
    expect(result).toBe(
      `<div data-locatorjs="${filePath}:11:5">Hello</div>`
    );
  });

  it("should return unchanged template if no tags found", () => {
    const input = `Just some text {{ interpolation }}`;
    const result = transformTemplate(input, { filePath });
    expect(result).toBe(input);
  });

  it("should handle self-closing tags", () => {
    const input = `<img src="test.png" /><br/>`;
    const result = transformTemplate(input, { filePath });
    expect(result).toContain(`<img data-locatorjs="${filePath}:1:0"`);
    expect(result).toContain(`<br data-locatorjs="${filePath}:1:22"`);
  });
});
