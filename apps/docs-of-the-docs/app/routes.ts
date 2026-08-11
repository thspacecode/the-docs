import { type RouteConfig, index, route } from "@react-router/dev/routes"
import { createDocsRoutes } from "@workspace/core/build"

export default [
  index("routes/home.tsx"),
  route("list", "routes/list.tsx"),
  ...createDocsRoutes(),
] satisfies RouteConfig
