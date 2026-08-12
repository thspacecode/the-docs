import type { PluginComponentProps } from "@the-docs/plugin-contract"

import type { MermaidModel } from "../types.js"

interface MermaidImageProps extends PluginComponentProps<MermaidModel> {
  alt?: string
}

export default function MermaidImage({
  model,
  alt = model.alt,
}: MermaidImageProps) {
  return (
    <img
      className="mermaid-image"
      src={model.dataUrl}
      alt={alt}
      width={model.width}
      height={model.height}
      loading="lazy"
      decoding="async"
    />
  )
}
