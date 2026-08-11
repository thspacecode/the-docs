import { fileURLToPath } from "node:url"

import { syntaxHighlighterPlugin } from "@workspace/plugin-syntax-highlighter"

export const docsContentRoot = fileURLToPath(
  new URL("../../docs", import.meta.url)
)

export const docsPlugins = [syntaxHighlighterPlugin()] as const
