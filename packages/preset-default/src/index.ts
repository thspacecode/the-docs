import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import type { ExcalidrawPluginOptions } from "@workspace/plugin-excalidraw"
import type { SyntaxHighlighterOptions } from "@workspace/plugin-syntax-highlighter"

export interface DefaultPresetPluginOptions {
  /** Set to false to leave fenced code blocks unhighlighted. */
  syntaxHighlighter?: SyntaxHighlighterOptions | false
  /** Set to false to leave .excalidraw references unprocessed. */
  excalidraw?: ExcalidrawPluginOptions | false
}

export interface DefaultPresetOptions {
  /** Directory containing one <slug>/index.mdx directory per document. */
  contentRoot: string | URL
  plugins?: DefaultPresetPluginOptions
}

export interface DefaultPresetConfig {
  readonly contentRoot: string
  readonly plugins: Readonly<{
    syntaxHighlighter: SyntaxHighlighterOptions | false
    excalidraw: ExcalidrawPluginOptions | false
  }>
}

function resolveContentRoot(contentRoot: string | URL) {
  return contentRoot instanceof URL
    ? fileURLToPath(contentRoot)
    : resolve(contentRoot)
}

/** Resolves the small set of project inputs against the default docs preset. */
export function defineConfig(
  options: DefaultPresetOptions
): DefaultPresetConfig {
  return Object.freeze({
    contentRoot: resolveContentRoot(options.contentRoot),
    plugins: Object.freeze({
      syntaxHighlighter: options.plugins?.syntaxHighlighter ?? {},
      excalidraw: options.plugins?.excalidraw ?? {},
    }),
  })
}
