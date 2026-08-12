import type { ComponentType } from "react"

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue }

export type PluginTarget =
  | {
      kind: "code-fence"
      /** Use `*` to handle code fences in every language. */
      language: string
    }
  | {
      kind: "asset"
      extensions: readonly string[]
    }

export type PluginInput =
  | {
      kind: "code-fence"
      language: string
      content: string
      documentPath: string
    }
  | {
      kind: "asset"
      url: string
      extension: string
      content: Uint8Array
      documentPath: string
    }

export interface PluginParseContext {
  /** Allows a build to cancel expensive parsing work. */
  signal?: AbortSignal
}

export interface PluginComponentProps<TModel extends JsonValue> {
  model: TModel
}

export interface ImageRenderOptions {
  format: "png" | "svg" | "webp"
  width?: number
  height?: number
  pixelRatio?: number
  theme?: string
}

export interface GeneratedImage {
  content: Uint8Array
  mediaType: string
  width?: number
  height?: number
}

export interface MdxPlugin<TModel extends JsonValue> {
  id: string
  version: string

  /** MDX constructs handled by this plugin. */
  targets: readonly PluginTarget[]

  /** Validate and convert source content into serializable data. */
  parse(input: PluginInput, context: PluginParseContext): Promise<TModel>

  /** Runtime React renderer, loaded lazily. */
  component: {
    load(): Promise<{
      default: ComponentType<PluginComponentProps<TModel>>
    }>
  }

  /** Optional build-time image generation. */
  build?: {
    renderToImage(
      model: TModel,
      options: ImageRenderOptions
    ): Promise<GeneratedImage>
  }
}

/**
 * Defines an MDX plugin while preserving its model type for parse and render.
 */
export function defineMdxPlugin<TModel extends JsonValue>(
  plugin: MdxPlugin<TModel>
): MdxPlugin<TModel> {
  return plugin
}
