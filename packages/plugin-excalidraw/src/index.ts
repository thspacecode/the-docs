import { basename } from "node:path"

import { defineMdxPlugin } from "@workspace/plugin-contract"

import type { ExcalidrawModel, ExcalidrawPluginOptions } from "./types.ts"
import { resolveExcalidrawPluginOptions } from "./types.ts"

export type { ExcalidrawModel, ExcalidrawPluginOptions } from "./types.ts"

/**
 * Renders .excalidraw assets to SVG while MDX is compiled. The browser only
 * receives the generated image; the source scene and renderer stay out of the
 * client bundle.
 */
export function excalidrawPlugin(options: ExcalidrawPluginOptions = {}) {
  const resolvedOptions = resolveExcalidrawPluginOptions(options)

  return defineMdxPlugin<ExcalidrawModel>({
    id: "excalidraw",
    version: "1.0.0",
    targets: [{ kind: "asset", extensions: [".excalidraw"] }],
    async parse(input, context) {
      if (input.kind !== "asset" || input.extension !== ".excalidraw") {
        throw new TypeError(
          "The Excalidraw plugin only accepts .excalidraw assets"
        )
      }

      context.signal?.throwIfAborted()

      const { renderExcalidrawToSvg } = await import("./build/render.ts")
      const image = await renderExcalidrawToSvg(input.content, {
        padding: resolvedOptions.padding,
        signal: context.signal,
      })

      return {
        dataUrl: `data:image/svg+xml;base64,${Buffer.from(image.svg).toString("base64")}`,
        width: image.width,
        height: image.height,
        title: basename(input.url, input.extension),
        scene: JSON.stringify(
          JSON.parse(new TextDecoder().decode(input.content)) as unknown
        ),
      }
    },
    component: {
      load: () => import("./runtime/excalidraw-image.tsx"),
    },
    build: {
      async renderToImage(model, renderOptions) {
        if (renderOptions.format !== "svg") {
          throw new TypeError(
            "Excalidraw currently renders build images as SVG"
          )
        }

        return {
          content: Buffer.from(model.dataUrl.split(",", 2)[1] ?? "", "base64"),
          mediaType: "image/svg+xml",
          width: model.width,
          height: model.height,
        }
      },
    },
  })
}
