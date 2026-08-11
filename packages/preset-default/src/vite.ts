import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { createDocsVitePlugins } from "@workspace/core/build"
import { excalidrawRehypePlugin } from "@workspace/plugin-excalidraw/build"
import { syntaxHighlighterRehypePlugin } from "@workspace/plugin-syntax-highlighter/build"
import { defineConfig } from "vite"

import type { DefaultPresetConfig } from "./index.ts"

/** Creates the complete Vite configuration for the default docs application. */
export function createViteConfig(config: DefaultPresetConfig) {
  const syntaxHighlighter = config.plugins.syntaxHighlighter
  const excalidraw = config.plugins.excalidraw

  return defineConfig({
    resolve: { tsconfigPaths: true },
    plugins: [
      tailwindcss(),
      ...createDocsVitePlugins({
        contentRoot: config.contentRoot,
        mdx: {
          rehypePlugins: [
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
