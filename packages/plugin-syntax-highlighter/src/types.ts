export type SyntaxHighlighterModel = {
  html: string
  language: string
}

export interface SyntaxHighlighterOptions {
  /** Theme used when the page is in light mode. */
  lightTheme?: string
  /** Theme exposed through Shiki CSS variables for dark mode. */
  darkTheme?: string
  /** Language used for unlabeled or unsupported code fences. */
  fallbackLanguage?: string
}

export const defaultSyntaxHighlighterOptions = {
  lightTheme: "github-light",
  darkTheme: "github-dark",
  fallbackLanguage: "text",
} as const

export function resolveSyntaxHighlighterOptions(
  options: SyntaxHighlighterOptions = {}
) {
  return {
    ...defaultSyntaxHighlighterOptions,
    ...options,
  }
}
