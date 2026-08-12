import rehypeShiki from "@shikijs/rehype"

import type { SyntaxHighlighterOptions } from "../types.ts"
import { resolveSyntaxHighlighterOptions } from "../types.ts"

export { highlightCode } from "./highlight.ts"

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
