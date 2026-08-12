import type { Config } from "@react-router/dev/config"
import {
  getDocsPrerenderPaths,
  getScopePrerenderPaths,
} from "@the-docs/core/build"

import type { DefaultPresetConfig } from "./index.js"

/** Creates the React Router framework configuration and all prerender paths. */
export function createReactRouterConfig(config: DefaultPresetConfig): Config {
  return {
    buildDirectory: ".build",
    routeDiscovery: { mode: "initial" },
    ssr: true,
    prerender: [
      "/",
      "/list",
      "/tags/tree",
      "/tags/graph",
      "/scopes",
      ...getScopePrerenderPaths(config.contentRoot),
      ...getDocsPrerenderPaths(config.contentRoot),
    ],
  }
}
