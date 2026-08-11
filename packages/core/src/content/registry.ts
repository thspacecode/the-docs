/// <reference path="../virtual-docs-content.d.ts" />

import {
  documents as virtualDocuments,
  tags as virtualTags,
} from "virtual:docs-content"

import type {
  DocumentEntry,
  DocumentFrontmatter,
  TagDefinition,
  VirtualDocumentEntry,
  VirtualTagDefinition,
} from "./types"

function fallbackTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function normalizeFrontmatter(
  slug: string,
  value: Record<string, unknown>
): DocumentFrontmatter {
  return {
    title:
      typeof value.title === "string" && value.title.trim()
        ? value.title.trim()
        : fallbackTitle(slug),
    description: optionalString(value.description),
    tags: Array.isArray(value.tags)
      ? [
          ...new Set(
            value.tags
              .filter((tag): tag is string => typeof tag === "string")
              .map((tag) => tag.trim())
              .filter(Boolean)
          ),
        ]
      : [],
    type: optionalString(value.type),
    scope: optionalString(value.scope),
    importance: optionalString(value.importance),
  }
}

const documents = (virtualDocuments as VirtualDocumentEntry[]).map(
  (document): DocumentEntry => ({
    ...document,
    frontmatter: normalizeFrontmatter(document.slug, document.frontmatter),
  })
)

const documentsBySlug = new Map(
  documents.map((document) => [document.slug, document])
)

const tags = (virtualTags as VirtualTagDefinition[]).map(
  ({ slug, parentSlug, definition }): TagDefinition => ({
    slug,
    parentSlug,
    title:
      typeof definition.title === "string" && definition.title.trim()
        ? definition.title.trim()
        : fallbackTitle(slug.split("/").at(-1) ?? slug),
    description: optionalString(definition.description) ?? "",
    color: optionalString(definition.color),
  })
)

export function getDocument(slug: string) {
  return documentsBySlug.get(slug)
}

export function getDocuments() {
  return documents
}

export function getTags() {
  return tags
}
