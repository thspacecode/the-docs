import { resolve } from "node:path"

import { discoverDocuments, discoverScopes } from "./discovery.js"

export function getDocsPrerenderPaths(contentRoot: string) {
  return discoverDocuments(resolve(contentRoot)).map(({ slug }) => `/p/${slug}`)
}

export function getScopePrerenderPaths(contentRoot: string) {
  return discoverScopes(resolve(contentRoot)).map(
    ({ slug }) => `/scopes/${slug}`
  )
}
