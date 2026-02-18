import reactAdapter from "./react/reactAdapter";
import {
  detectAngular,
  detectJSX,
  detectReact,
  detectSvelte,
  detectVue,
} from "@locator/shared";
import { ParentPathItem } from "./adapterApi";
import svelteAdapter from "./svelte/svelteAdapter";
import jsxAdapter from "./jsx/jsxAdapter";
import vueAdapter from "./vue/vueAdapter";
import angularAdapter from "./angular/angularAdapter";

export function getParentsPaths(
  target: HTMLElement,
  adapterId?: string
): ParentPathItem[] {
  if (adapterId === "react" && reactAdapter.getParentsPaths) {
    return reactAdapter.getParentsPaths(target);
  }
  if (adapterId === "svelte" && svelteAdapter.getParentsPaths) {
    return svelteAdapter.getParentsPaths(target);
  }
  if (adapterId === "vue" && vueAdapter.getParentsPaths) {
    return vueAdapter.getParentsPaths(target);
  }
  if (adapterId === "jsx" && jsxAdapter.getParentsPaths) {
    return jsxAdapter.getParentsPaths(target);
  }
  if (adapterId === "angular" && angularAdapter.getParentsPaths) {
    return angularAdapter.getParentsPaths(target);
  }

  if (detectSvelte() && svelteAdapter.getParentsPaths) {
    return svelteAdapter.getParentsPaths(target);
  }

  if (detectVue() && vueAdapter.getParentsPaths) {
    return vueAdapter.getParentsPaths(target);
  }

  if (detectReact() && reactAdapter.getParentsPaths) {
    return reactAdapter.getParentsPaths(target);
  }

  if (detectAngular() && angularAdapter.getParentsPaths) {
    return angularAdapter.getParentsPaths(target);
  }

  // // Must be last, because its global data leaks from Locator extension.
  // // Because the extension is in SolidJS and it uses JSX plugin in dev mode.
  if (detectJSX() && jsxAdapter.getParentsPaths) {
    return jsxAdapter.getParentsPaths(target);
  }

  return [];
}
