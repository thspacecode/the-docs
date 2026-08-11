import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { createDocsVitePlugins } from "@workspace/core/build"
import { defineConfig } from "vite"

import { docsContentRoot } from "./docs.config"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    ...createDocsVitePlugins({ contentRoot: docsContentRoot }),
    reactRouter(),
  ],
})
