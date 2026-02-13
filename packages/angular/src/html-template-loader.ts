import { transformTemplate } from "./transform-template";

interface LoaderContext {
  async(): (err: Error | null, content?: string) => void;
  resourcePath: string;
}

/**
 * Webpack loader for Angular external HTML templates (.html files).
 * Must run with enforce: 'pre' before @ngtools/webpack.
 */
function htmlTemplateLoader(this: LoaderContext, source: string): void {
  const callback = this.async();
  const filePath = this.resourcePath;

  // Skip node_modules
  if (filePath.includes("node_modules")) {
    callback(null, source);
    return;
  }

  try {
    const result = transformTemplate(source, { filePath });
    callback(null, result);
  } catch (error) {
    console.warn(
      `[@locator/angular] Failed to transform ${filePath}:`,
      error instanceof Error ? error.message : String(error)
    );
    callback(null, source);
  }
}

export default htmlTemplateLoader;
