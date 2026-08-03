import { fileURLToPath } from "node:url"

export const docsContentRoot = fileURLToPath(
  new URL("../../docs", import.meta.url)
)
