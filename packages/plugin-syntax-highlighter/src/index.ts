import { defineMdxPlugin } from "@the-docs/plugin-contract"

import type { SyntaxHighlighterModel } from "./types.js"
import type { SyntaxHighlighterOptions } from "./types.js"

export type {
  SyntaxHighlighterModel,
  SyntaxHighlighterOptions,
} from "./types.js"

/**
 * Highlights every fenced code block at build time and renders Shiki's safe,
 * escaped HTML at runtime.
 */
export function syntaxHighlighterPlugin(
  options: SyntaxHighlighterOptions = {}
) {
  return defineMdxPlugin<SyntaxHighlighterModel>({
    id: "syntax-highlighter",
    version: "1.0.0",
    targets: [{ kind: "code-fence", language: "*" }],
    async parse(input, context) {
      if (input.kind !== "code-fence") {
        throw new TypeError(
          "The syntax highlighter only accepts code-fence input"
        )
      }

      context.signal?.throwIfAborted()

      const { highlightCode } = await import("./build/highlight.js")
      return highlightCode(
        input.content,
        input.language,
        options,
        context.signal
      )
    },
    component: {
      load: () => import("./runtime/syntax-highlighted-code.js"),
    },
  })
}
