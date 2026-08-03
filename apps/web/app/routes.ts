import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("docs/p/:slug", "routes/docs-post.tsx"),
] satisfies RouteConfig
