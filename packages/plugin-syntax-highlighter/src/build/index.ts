import rehypeShiki from "@shikijs/rehype"

import type { SyntaxHighlighterOptions } from "../types.js"
import { resolveSyntaxHighlighterOptions } from "../types.js"

export { highlightCode } from "./highlight.js"

/**
 * MDX compiler adapter for the syntax highlighter plugin.
 *
 * Keep this build-only export in Vite config so Shiki is not part of the
 * browser runtime bundle.
 */
export function syntaxHighlighterRehypePlugin(
  options: SyntaxHighlighterOptions = {}
): [typeof rehypeShiki, NonNullable<Parameters<typeof rehypeShiki>[0]>] {
  const resolvedOptions = resolveSyntaxHighlighterOptions(options)

  return [
    rehypeShiki,
    {
      themes: {
        light: resolvedOptions.lightTheme,
        dark: resolvedOptions.darkTheme,
      },
      defaultLanguage: resolvedOptions.fallbackLanguage,
      fallbackLanguage: resolvedOptions.fallbackLanguage,
    },
  ]
}
