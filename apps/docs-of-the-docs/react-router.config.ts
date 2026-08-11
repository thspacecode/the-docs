import type { Config } from "@react-router/dev/config"
import { getDocsPrerenderPaths } from "@workspace/core/build"

import { docsContentRoot } from "./docs.config"

export default {
  ssr: true,
  prerender: ["/", ...getDocsPrerenderPaths(docsContentRoot)],
} satisfies Config
