import type { PluginComponentProps } from "@the-docs/plugin-contract"

import type { SyntaxHighlighterModel } from "../types.js"

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
