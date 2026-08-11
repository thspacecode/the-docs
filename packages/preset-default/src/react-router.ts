import type { Config } from "@react-router/dev/config"
import {
  getDocsPrerenderPaths,
  getScopePrerenderPaths,
} from "@workspace/core/build"

import type { DefaultPresetConfig } from "./index.ts"

/** Creates the React Router framework configuration and all prerender paths. */
export function createReactRouterConfig(config: DefaultPresetConfig): Config {
  return {
    buildDirectory: ".build",
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
