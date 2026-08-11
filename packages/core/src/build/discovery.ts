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

export interface DiscoveredScope {
  filePath: string
  slug: string
}

export interface DiscoveredType {
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

export function discoverScopes(contentRoot: string): DiscoveredScope[] {
  const scopesRoot = join(contentRoot, "_scopes")

  let entries

  try {
    entries = readdirSync(scopesRoot, { withFileTypes: true })
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
      filePath: join(scopesRoot, entry.name, "scope.json"),
      slug: entry.name,
    }))
    .filter(({ filePath }) => existsSync(filePath))
    .sort((left, right) => left.slug.localeCompare(right.slug))
}

export function discoverTypes(contentRoot: string): DiscoveredType[] {
  const typesRoot = join(contentRoot, "_types")

  let entries

  try {
    entries = readdirSync(typesRoot, { withFileTypes: true })
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
      filePath: join(typesRoot, entry.name, "type.json"),
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
