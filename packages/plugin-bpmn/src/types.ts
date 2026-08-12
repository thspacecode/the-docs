export type BpmnModel = {
  dataUrl: string
  width: number
  height: number
  title: string
}

export interface BpmnPluginOptions {
  /** Empty space, in pixels, around the rendered process diagram. */
  padding?: number
}

export const defaultBpmnPluginOptions = {
  padding: 24,
} as const

export function resolveBpmnPluginOptions(options: BpmnPluginOptions = {}) {
  const padding = Number.isFinite(options.padding)
    ? Math.max(0, options.padding ?? defaultBpmnPluginOptions.padding)
    : defaultBpmnPluginOptions.padding

  return { padding }
}
