import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { createDocsVitePlugins } from "@workspace/core/build"
import { excalidrawRehypePlugin } from "@workspace/plugin-excalidraw/build"
import { mermaidRehypePlugin } from "@workspace/plugin-mermaid/build"
import { syntaxHighlighterRehypePlugin } from "@workspace/plugin-syntax-highlighter/build"
import { defineConfig } from "vite"

import type { DefaultPresetConfig } from "./index.ts"

/** Creates the complete Vite configuration for the default docs application. */
export function createViteConfig(config: DefaultPresetConfig) {
  const syntaxHighlighter = config.plugins.syntaxHighlighter
  const mermaid = config.plugins.mermaid
  const excalidraw = config.plugins.excalidraw

  return defineConfig({
    resolve: { tsconfigPaths: true },
    plugins: [
      tailwindcss(),
      ...createDocsVitePlugins({
        contentRoot: config.contentRoot,
        mdx: {
          rehypePlugins: [
            ...(mermaid === false ? [] : [mermaidRehypePlugin(mermaid)]),
            ...(syntaxHighlighter === false
              ? []
              : [syntaxHighlighterRehypePlugin(syntaxHighlighter)]),
            ...(excalidraw === false
              ? []
              : [excalidrawRehypePlugin(excalidraw)]),
          ],
        },
      }),
      reactRouter(),
    ],
  })
}
