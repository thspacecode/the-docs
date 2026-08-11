import type { PluginComponentProps } from "@workspace/plugin-contract"

import type { BpmnModel } from "../types.ts"

interface BpmnImageProps extends PluginComponentProps<BpmnModel> {
  alt?: string
}

export default function BpmnImage({
  model,
  alt = model.title,
}: BpmnImageProps) {
  return (
    <img
      className="bpmn-image"
      src={model.dataUrl}
      alt={alt}
      width={model.width}
      height={model.height}
      loading="lazy"
      decoding="async"
    />
  )
}
