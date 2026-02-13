interface LoaderContext {
    async(): (err: Error | null, content?: string) => void;
    resourcePath: string;
}
/**
 * Webpack loader for Angular component .ts files with inline templates.
 * Must run with enforce: 'pre' before @ngtools/webpack.
 */
declare function tsInlineTemplateLoader(this: LoaderContext, source: string): void;
export default tsInlineTemplateLoader;
//# sourceMappingURL=ts-inline-template-loader.d.ts.map