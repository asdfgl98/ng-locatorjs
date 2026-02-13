import { transformInlineTemplate } from "./transform-inline-template";

interface LoaderContext {
  async(): (err: Error | null, content?: string) => void;
  resourcePath: string;
}

/**
 * Webpack loader for Angular component .ts files with inline templates.
 * Must run with enforce: 'pre' before @ngtools/webpack.
 */
function tsInlineTemplateLoader(this: LoaderContext, source: string): void {
  const callback = this.async();
  const filePath = this.resourcePath;

  // Skip node_modules
  if (filePath.includes("node_modules")) {
    callback(null, source);
    return;
  }

  // Only process files that likely contain inline templates
  if (!source.includes("@Component") || !source.includes("template")) {
    callback(null, source);
    return;
  }

  try {
    const result = transformInlineTemplate(source, filePath);
    callback(null, result);
  } catch (error) {
    console.warn(
      `[@locator/angular] Failed to transform inline template in ${filePath}:`,
      error instanceof Error ? error.message : String(error)
    );
    callback(null, source);
  }
}

export default tsInlineTemplateLoader;
