interface LoaderContext {
    async(): (err: Error | null, content?: string) => void;
    resourcePath: string;
}
/**
 * Webpack loader for Angular external HTML templates (.html files).
 * Must run with enforce: 'pre' before @ngtools/webpack.
 */
declare function htmlTemplateLoader(this: LoaderContext, source: string): void;
export default htmlTemplateLoader;
//# sourceMappingURL=html-template-loader.d.ts.map