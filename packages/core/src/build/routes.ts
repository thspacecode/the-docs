import { fileURLToPath } from "node:url"

import type { RouteConfigEntry } from "@react-router/dev/routes"

const docsPostRouteFile = fileURLToPath(
  new URL("../route/docs-post.tsx", import.meta.url)
)

export function createDocsRoutes(): RouteConfigEntry[] {
  return [
    {
      id: "docs-post",
      path: "p/:slug",
      file: docsPostRouteFile,
    },
    {
      id: "legacy-docs-post",
      path: "docs/p/:slug",
      file: docsPostRouteFile,
    },
  ]
}
