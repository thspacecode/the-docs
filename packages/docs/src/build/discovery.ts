import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface DiscoveredDocument {
  filePath: string
  slug: string
}

export function discoverDocuments(contentRoot: string): DiscoveredDocument[] {
  let entries

  try {
    entries = readdirSync(contentRoot, { withFileTypes: true })
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return []
    }

    throw error
  }

  return entries
    .filter((entry) => entry.isDirectory() && slugPattern.test(entry.name))
    .map((entry) => ({
      filePath: join(contentRoot, entry.name, "index.mdx"),
      slug: entry.name,
    }))
    .filter(({ filePath }) => existsSync(filePath))
    .sort((left, right) => left.slug.localeCompare(right.slug))
}
