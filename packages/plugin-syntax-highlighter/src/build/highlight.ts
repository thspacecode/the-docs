import { codeToHtml } from "shiki"

import type {
  SyntaxHighlighterModel,
  SyntaxHighlighterOptions,
} from "../types.js"
import { resolveSyntaxHighlighterOptions } from "../types.js"

export async function highlightCode(
  code: string,
  language: string,
  options: SyntaxHighlighterOptions = {},
  signal?: AbortSignal
): Promise<SyntaxHighlighterModel> {
  signal?.throwIfAborted()

  const resolvedOptions = resolveSyntaxHighlighterOptions(options)
  const requestedLanguage =
    language.trim().toLowerCase() || resolvedOptions.fallbackLanguage
  const highlighterOptions = {
    themes: {
      light: resolvedOptions.lightTheme,
      dark: resolvedOptions.darkTheme,
    },
  }

  let highlightedLanguage = requestedLanguage
  let html: string

  try {
    html = await codeToHtml(code, {
      ...highlighterOptions,
      lang: requestedLanguage,
    })
  } catch (error) {
    if (requestedLanguage === resolvedOptions.fallbackLanguage) {
      throw error
    }

    highlightedLanguage = resolvedOptions.fallbackLanguage
    html = await codeToHtml(code, {
      ...highlighterOptions,
      lang: resolvedOptions.fallbackLanguage,
    })
  }

  signal?.throwIfAborted()

  return {
    html,
    language: highlightedLanguage,
  }
}
