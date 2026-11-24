import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import type { DocsViteOptions } from "@the-docs/core/build"
import type { BpmnPluginOptions } from "@the-docs/plugin-bpmn"
import type { DataTablePluginOptions } from "@the-docs/plugin-data-table"
import type { ExcalidrawPluginOptions } from "@the-docs/plugin-excalidraw"
import type { MermaidPluginOptions } from "@the-docs/plugin-mermaid"
import type { SyntaxHighlighterOptions } from "@the-docs/plugin-syntax-highlighter"

export interface DefaultPresetPluginOptions {
  /** Set to false to disable automatic <Ontology /> imports in MDX. */
  ontology?: boolean
  /** Set to false to leave fenced code blocks unhighlighted. */
  syntaxHighlighter?: SyntaxHighlighterOptions | false
  /** Set to false to leave Mermaid code fences as code. */
  mermaid?: MermaidPluginOptions | false
  /** Set to false to leave .excalidraw references unprocessed. */
  excalidraw?: ExcalidrawPluginOptions | false
  /** Set to false to leave .bpmn references unprocessed. */
  bpmn?: BpmnPluginOptions | false
  /** Set to false to leave data-*.csv references as ordinary images. */
  dataTable?: DataTablePluginOptions | false
}

export interface DefaultPresetOptions {
  /** Directory containing one <slug>/index.mdx directory per document. */
  contentRoot: string | URL
  /** URL path where the application is mounted. Defaults to "/". */
  basePath?: string
  /** Additional MDX options. Custom plugins run after the preset plugins. */
  mdx?: DocsViteOptions["mdx"]
  plugins?: DefaultPresetPluginOptions
}

export interface DefaultPresetConfig {
  readonly contentRoot: string
  readonly basePath: string
  readonly mdx?: DocsViteOptions["mdx"]
  readonly plugins: Readonly<{
    syntaxHighlighter: SyntaxHighlighterOptions | false
    mermaid: MermaidPluginOptions | false
    excalidraw: ExcalidrawPluginOptions | false
    bpmn: BpmnPluginOptions | false
    ontology: boolean
    dataTable: DataTablePluginOptions | false
  }>
}

function resolveContentRoot(contentRoot: string | URL) {
  return contentRoot instanceof URL
    ? fileURLToPath(contentRoot)
    : resolve(contentRoot)
}

function normalizeBasePath(basePath: string | undefined) {
  if (!basePath || basePath === "/") return "/"

  const normalized = `/${basePath}`.replace(/\/{2,}/g, "/").replace(/\/$/, "")
  return normalized || "/"
}

/** Resolves the small set of project inputs against the default docs preset. */
export function defineConfig(
  options: DefaultPresetOptions
): DefaultPresetConfig {
  return Object.freeze({
    contentRoot: resolveContentRoot(options.contentRoot),
    basePath: normalizeBasePath(options.basePath),
    mdx: options.mdx,
    plugins: Object.freeze({
      syntaxHighlighter: options.plugins?.syntaxHighlighter ?? {},
      mermaid: options.plugins?.mermaid ?? {},
      excalidraw: options.plugins?.excalidraw ?? {},
      bpmn: options.plugins?.bpmn ?? {},
      dataTable: options.plugins?.dataTable ?? {},
      ontology: options.plugins?.ontology ?? true,
    }),
  })
}
