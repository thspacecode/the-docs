import { defineConfig } from "@workspace/preset-default"

export default defineConfig({
  contentRoot: new URL("../../docs", import.meta.url),
})
