import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface DiscoveredDocument {
  filePath: string
  slug: string
}

export interface DiscoveredTag {
  filePath: string
  parentSlug?: string
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

export function discoverTags(contentRoot: string): DiscoveredTag[] {
  const tagsRoot = join(contentRoot, "_tags")
  const tags: DiscoveredTag[] = []

  function visit(directory: string, segments: string[]) {
    let entries

    try {
      entries = readdirSync(directory, { withFileTypes: true })
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return
      }

      throw error
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || !slugPattern.test(entry.name)) continue

      const nextSegments = [...segments, entry.name]
      const tagDirectory = join(directory, entry.name)
      const filePath = join(tagDirectory, "tag.json")

      if (existsSync(filePath)) {
        tags.push({
          filePath,
          parentSlug: segments.length ? segments.join("/") : undefined,
          slug: nextSegments.join("/"),
        })
      }

      visit(tagDirectory, nextSegments)
    }
  }

  visit(tagsRoot, [])
  return tags.sort((left, right) => left.slug.localeCompare(right.slug))
}
