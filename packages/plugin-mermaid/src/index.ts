import { defineMdxPlugin } from "@workspace/plugin-contract"

import type { MermaidModel, MermaidPluginOptions } from "./types.ts"
import { resolveMermaidPluginOptions } from "./types.ts"

export type {
  MermaidModel,
  MermaidPluginOptions,
  MermaidTheme,
} from "./types.ts"

function diagramAlt(source: string) {
  return (
    source.match(/^\s*accTitle\s*:\s*(.+?)\s*$/im)?.[1] ?? "Mermaid diagram"
  )
}

/**
 * Turns Mermaid code fences into SVG-backed images while MDX is compiled.
 * Mermaid and its DOM environment remain outside the browser bundle.
 */
export function mermaidPlugin(options: MermaidPluginOptions = {}) {
  const resolvedOptions = resolveMermaidPluginOptions(options)

  return defineMdxPlugin<MermaidModel>({
    id: "mermaid",
    version: "1.0.0",
    targets: [{ kind: "code-fence", language: "mermaid" }],
    async parse(input, context) {
      if (
        input.kind !== "code-fence" ||
        input.language.trim().toLowerCase() !== "mermaid"
      ) {
        throw new TypeError(
          "The Mermaid plugin only accepts mermaid code fences"
        )
      }

      context.signal?.throwIfAborted()

      const { renderMermaidToSvg } = await import("./build/render.ts")
      const image = await renderMermaidToSvg(input.content, {
        theme: resolvedOptions.theme,
        signal: context.signal,
      })

      return {
        dataUrl: `data:image/svg+xml;base64,${Buffer.from(image.svg).toString("base64")}`,
        width: image.width,
        height: image.height,
        alt: diagramAlt(input.content),
      }
    },
    component: {
      load: () => import("./runtime/mermaid-image.tsx"),
    },
    build: {
      async renderToImage(model, renderOptions) {
        if (renderOptions.format !== "svg") {
          throw new TypeError("Mermaid currently renders build images as SVG")
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
