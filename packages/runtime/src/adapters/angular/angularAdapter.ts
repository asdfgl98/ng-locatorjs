import { parseDataPath, splitFullPath } from "../../functions/parseDataId";
import type { TreeNode, TreeNodeComponent } from "../../types/TreeNode";
import type { Source } from "../../types/types";
import type {
  AdapterObject,
  FullElementInfo,
  ParentPathItem,
  TreeState,
} from "../adapterApi";
import { goUpByTheTree } from "../goUpByTheTree";
import { HtmlElementTreeNode } from "../HtmlElementTreeNode";
import { getAngularComponentInfo } from "./getAngularComponentInfo";

/**
 * Angular adapter for LocatorJS runtime.
 *
 * Dual strategy:
 * 1. Primary: Read data-locatorjs attributes injected by the build plugin
 *    → Provides element-level precision (exact template line/column)
 * 2. Fallback: Use ng.getComponent() / ng.getOwningComponent()
 *    → Provides component-level information only (no exact source location)
 */
export function getElementInfo(target: HTMLElement): FullElementInfo | null {
  // Strategy 1: data-locatorjs attribute (build plugin)
  const found = target.closest("[data-locatorjs]");

  if (found && found instanceof HTMLElement && found.dataset.locatorjs) {
    const dataPath = found.dataset.locatorjs;
    const parsed = parseDataPath(dataPath);

    if (!parsed) {
      return null;
    }

    const [fileFullPath, line, column] = parsed;
    const [projectPath, filePath] = splitFullPath(fileFullPath);

    const tagName = found.tagName.toLowerCase();

    return {
      thisElement: {
        box: found.getBoundingClientRect(),
        label: tagName,
        link: {
          filePath,
          projectPath,
          column,
          line,
        },
      },
      htmlElement: found,
      parentElements: [],
      componentBox: found.getBoundingClientRect(),
      componentsLabels: getComponentLabels(found),
    };
  }

  // Strategy 2: ng.getComponent() fallback
  const componentInfo = getAngularComponentInfo(target);
  if (componentInfo) {
    return {
      thisElement: {
        box: target.getBoundingClientRect(),
        label: componentInfo.componentName,
        link: null,
      },
      htmlElement: target,
      parentElements: [],
      componentBox: target.getBoundingClientRect(),
      componentsLabels: [
        {
          label: componentInfo.componentName,
          link: null,
        },
      ],
    };
  }

  return null;
}

/**
 * Get component labels by walking up to find the nearest component host element.
 */
function getComponentLabels(
  element: HTMLElement
): { label: string; link: { filePath: string; projectPath: string; column: number; line: number } | null }[] {
  // In Angular, custom elements (component selectors) are the component boundaries.
  // Walk up to find the nearest custom element (contains a hyphen in tag name).
  let current: HTMLElement | null = element;

  while (current) {
    const tagName = current.tagName.toLowerCase();

    // Angular components typically use hyphenated selectors like <app-header>
    if (tagName.includes("-") && current.dataset.locatorjs) {
      const parsed = parseDataPath(current.dataset.locatorjs);
      if (parsed) {
        const [fileFullPath, line, column] = parsed;
        const [projectPath, filePath] = splitFullPath(fileFullPath);
        return [
          {
            label: tagName,
            link: { filePath, projectPath, column, line },
          },
        ];
      }
    }

    current = current.parentElement;
  }

  return [];
}

class AngularTreeNodeElement extends HtmlElementTreeNode {
  getSource(): Source | null {
    const dataPath = this.element.dataset.locatorjs;
    if (!dataPath) {
      return null;
    }

    const parsed = parseDataPath(dataPath);
    if (!parsed) {
      return null;
    }

    const [fileFullPath, line, column] = parsed;
    const [projectPath, fileName] = splitFullPath(fileFullPath);

    return {
      fileName,
      projectPath,
      columnNumber: column,
      lineNumber: line,
    };
  }

  getComponent(): TreeNodeComponent | null {
    const tagName = this.element.tagName.toLowerCase();

    // Only consider custom elements as components
    if (!tagName.includes("-")) {
      return null;
    }

    const dataPath = this.element.dataset.locatorjs;
    if (!dataPath) {
      // Try ng.getComponent fallback
      const componentInfo = getAngularComponentInfo(this.element);
      if (componentInfo) {
        return {
          label: componentInfo.componentName,
        };
      }
      return null;
    }

    const parsed = parseDataPath(dataPath);
    if (!parsed) {
      return null;
    }

    const [fileFullPath, line, column] = parsed;
    const [projectPath, fileName] = splitFullPath(fileFullPath);

    return {
      label: tagName,
      definitionLink: {
        fileName,
        projectPath,
        columnNumber: column,
        lineNumber: line,
      },
    };
  }
}

function getTree(element: HTMLElement): TreeState | null {
  const originalRoot: TreeNode = new AngularTreeNodeElement(element);
  return goUpByTheTree(originalRoot);
}

function getParentsPaths(element: HTMLElement): ParentPathItem[] {
  const path: ParentPathItem[] = [];
  let currentElement: HTMLElement | null = element;
  let previousComponentKey: string | null = null;

  do {
    if (currentElement) {
      const info = getElementInfo(currentElement);
      const currentComponentKey = JSON.stringify(info?.componentsLabels);
      if (info && currentComponentKey !== previousComponentKey) {
        previousComponentKey = currentComponentKey;

        const link = info.thisElement.link;
        const label = info.thisElement.label;

        if (link) {
          path.push({
            title: label,
            link: link,
          });
        }
      }
    }

    currentElement = currentElement.parentElement;
  } while (currentElement);

  return path;
}

const angularAdapter: AdapterObject = {
  getElementInfo,
  getTree,
  getParentsPaths,
};

export default angularAdapter;
