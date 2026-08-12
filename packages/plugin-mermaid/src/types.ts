export type MermaidTheme = "default" | "base" | "dark" | "forest" | "neutral"

export type MermaidModel = {
  dataUrl: string
  width: number
  height: number
  alt: string
}

export interface MermaidPluginOptions {
  /** Mermaid's built-in theme used for generated diagrams. */
  theme?: MermaidTheme
}

export const defaultMermaidPluginOptions = {
  theme: "neutral",
} as const

export function resolveMermaidPluginOptions(
  options: MermaidPluginOptions = {}
) {
  return {
    ...defaultMermaidPluginOptions,
    ...options,
  }
}
