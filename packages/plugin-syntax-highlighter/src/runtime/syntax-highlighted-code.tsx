import type { PluginComponentProps } from "@workspace/plugin-contract"

import type { SyntaxHighlighterModel } from "../types.ts"

export default function SyntaxHighlightedCode({
  model,
}: PluginComponentProps<SyntaxHighlighterModel>) {
  return (
    <div
      className="syntax-highlighter"
      data-language={model.language}
      dangerouslySetInnerHTML={{ __html: model.html }}
    />
  )
}
