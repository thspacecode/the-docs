import { resolve } from "node:path"

import { discoverDocuments } from "./discovery.ts"

export function getDocsPrerenderPaths(contentRoot: string) {
  return discoverDocuments(resolve(contentRoot)).map(
    ({ slug }) => `/docs/p/${slug}`
  )
}
