import { fileURLToPath } from "node:url"

import type { RouteConfigEntry } from "@react-router/dev/routes"
import { createDocsRoutes } from "@workspace/core/build"

const homeRouteFile = fileURLToPath(
  new URL("./route/home.tsx", import.meta.url)
)
const listRouteFile = fileURLToPath(
  new URL("./route/list.tsx", import.meta.url)
)

/** Returns the complete route table supplied by the default preset. */
export function createRoutes(): RouteConfigEntry[] {
  return [
    { index: true, file: homeRouteFile },
    { path: "list", file: listRouteFile },
    ...createDocsRoutes(),
  ]
}
