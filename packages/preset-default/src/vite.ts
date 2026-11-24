import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { createDocsVitePlugins } from "@the-docs/core/build"
import { bpmnRehypePlugin } from "@the-docs/plugin-bpmn/build"
import { dataTableRehypePlugin } from "@the-docs/plugin-data-table/build"
import { excalidrawRehypePlugin } from "@the-docs/plugin-excalidraw/build"
import { mermaidRehypePlugin } from "@the-docs/plugin-mermaid/build"
import { syntaxHighlighterRehypePlugin } from "@the-docs/plugin-syntax-highlighter/build"
import { ontologyRehypePlugin } from "@the-docs/plugin-ontology/build"
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
    base: config.basePath === "/" ? "/" : `${config.basePath}/`,
    resolve: {
      tsconfigPaths: true,
      dedupe: ["react", "react-dom", "react-router"],
    },
    ssr: { noExternal: [/^@the-docs\//] },
    optimizeDeps: {
      include: [
        "react",
        "react-dom/client",
        "react/jsx-runtime",
        "react-router",
      ],
    },
    plugins: [
      tailwindcss(),
      ...createDocsVitePlugins({
        contentRoot: config.contentRoot,
        mdx: {
          ...config.mdx,
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
            ...(config.plugins.ontology === false
              ? []
              : [ontologyRehypePlugin]),
            ...(config.mdx?.rehypePlugins ?? []),
          ],
        },
      }),
      reactRouter(),
    ],
  })
}
