export type ExcalidrawModel = {
  /** Padding used by the browser preview. Older models use 16 pixels. */
  padding?: number
  dataUrl: string
  width: number
  height: number
  title: string
  /** Serialized source scene used by the interactive viewer. */
  scene: string
}

export interface ExcalidrawPluginOptions {
  /** Empty space, in pixels, around the exported drawing. */
  padding?: number
}

export const defaultExcalidrawPluginOptions = {
  padding: 16,
} as const

export function resolveExcalidrawPluginOptions(
  options: ExcalidrawPluginOptions = {}
) {
  return {
    ...defaultExcalidrawPluginOptions,
    ...options,
  }
}
