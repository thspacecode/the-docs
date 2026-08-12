import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { createDocsVitePlugins } from "@the-docs/core/build"
import { bpmnRehypePlugin } from "@the-docs/plugin-bpmn/build"
import { dataTableRehypePlugin } from "@the-docs/plugin-data-table/build"
import { excalidrawRehypePlugin } from "@the-docs/plugin-excalidraw/build"
import { mermaidRehypePlugin } from "@the-docs/plugin-mermaid/build"
import { syntaxHighlighterRehypePlugin } from "@the-docs/plugin-syntax-highlighter/build"
import { defineConfig } from "vite"

import type { DefaultPresetConfig } from "./index.js"

/** Creates the complete Vite configuration for the default docs application. */
export function createViteConfig(config: DefaultPresetConfig) {
  const syntaxHighlighter = config.plugins.syntaxHighlighter
  const mermaid = config.plugins.mermaid
  const excalidraw = config.plugins.excalidraw
  const bpmn = config.plugins.bpmn
  const dataTable = config.plugins.dataTable

  return defineConfig({
    resolve: { tsconfigPaths: true },
    ssr: { noExternal: [/^@the-docs\//] },
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
            ...(bpmn === false ? [] : [bpmnRehypePlugin(bpmn)]),
            ...(dataTable === false ? [] : [dataTableRehypePlugin(dataTable)]),
          ],
        },
      }),
      reactRouter(),
    ],
  })
}
