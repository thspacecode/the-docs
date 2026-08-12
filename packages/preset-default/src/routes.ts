import { fileURLToPath } from "node:url"

import type { RouteConfigEntry } from "@react-router/dev/routes"
import { createDocsRoutes } from "@the-docs/core/build"

const homeRouteFile = fileURLToPath(
  new URL("./route/home.js", import.meta.url)
)
const listRouteFile = fileURLToPath(
  new URL("./route/list.js", import.meta.url)
)
const tagsTreeRouteFile = fileURLToPath(
  new URL("./route/tags-tree.js", import.meta.url)
)
const tagsGraphRouteFile = fileURLToPath(
  new URL("./route/tags-graph.js", import.meta.url)
)
const scopesRouteFile = fileURLToPath(
  new URL("./route/scopes.js", import.meta.url)
)
const scopeRouteFile = fileURLToPath(
  new URL("./route/scope.js", import.meta.url)
)

/** Returns the complete route table supplied by the default preset. */
export function createRoutes(): RouteConfigEntry[] {
  return [
    { index: true, file: homeRouteFile },
    { path: "list", file: listRouteFile },
    { path: "tags/tree", file: tagsTreeRouteFile },
    { path: "tags/graph", file: tagsGraphRouteFile },
    { path: "scopes", file: scopesRouteFile },
    { path: "scopes/:scopeSlug", file: scopeRouteFile },
    ...createDocsRoutes(),
  ]
}
