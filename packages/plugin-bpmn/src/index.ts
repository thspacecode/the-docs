import { basename } from "node:path"

import { defineMdxPlugin } from "@workspace/plugin-contract"

import type { BpmnModel, BpmnPluginOptions } from "./types.ts"
import { resolveBpmnPluginOptions } from "./types.ts"

export type { BpmnModel, BpmnPluginOptions } from "./types.ts"

/**
 * Turns BPMN 2.0 XML assets into SVG-backed images while MDX is compiled. The
 * BPMN renderer and source XML remain outside the browser bundle.
 */
export function bpmnPlugin(options: BpmnPluginOptions = {}) {
  const resolvedOptions = resolveBpmnPluginOptions(options)

  return defineMdxPlugin<BpmnModel>({
    id: "bpmn",
    version: "1.0.0",
    targets: [{ kind: "asset", extensions: [".bpmn"] }],
    async parse(input, context) {
      if (input.kind !== "asset" || input.extension.toLowerCase() !== ".bpmn") {
        throw new TypeError("The BPMN plugin only accepts .bpmn assets")
      }

      context.signal?.throwIfAborted()

      const { renderBpmnToSvg } = await import("./build/render.ts")
      const image = await renderBpmnToSvg(input.content, {
        padding: resolvedOptions.padding,
        signal: context.signal,
      })

      return {
        dataUrl: `data:image/svg+xml;base64,${Buffer.from(image.svg).toString("base64")}`,
        width: image.width,
        height: image.height,
        title: basename(input.url, input.extension),
      }
    },
    component: {
      load: () => import("./runtime/bpmn-image.tsx"),
    },
    build: {
      async renderToImage(model, renderOptions) {
        if (renderOptions.format !== "svg") {
          throw new TypeError("BPMN currently renders build images as SVG")
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
