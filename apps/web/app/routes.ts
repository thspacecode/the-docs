import { type RouteConfig, index } from "@react-router/dev/routes"
import { createDocsRoutes } from "@workspace/docs/build"

export default [
  index("routes/home.tsx"),
  ...createDocsRoutes(),
] satisfies RouteConfig
