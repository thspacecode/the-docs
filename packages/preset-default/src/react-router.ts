import type { Config } from "@react-router/dev/config"
import { getDocsPrerenderPaths } from "@workspace/core/build"

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
      ...getDocsPrerenderPaths(config.contentRoot),
    ],
  }
}
