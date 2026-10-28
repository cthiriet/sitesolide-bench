import { defineConfig } from "astro/config";

// A fully static site: "npm run build" writes plain files to dist/.
export default defineConfig({
  output: "static",
  trailingSlash: "always",
  compressHTML: true,
  build: {
    format: "directory",
    // Keep the one shared stylesheet as a real file instead of inlining it.
    inlineStylesheets: "never",
  },
  devToolbar: { enabled: false },
  markdown: {
    shikiConfig: {
      // Two themes as CSS variables, switched by prefers-color-scheme in site.css.
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    },
  },
});
