/// <reference path="../virtual-docs-content.d.ts" />

import { documents as virtualDocuments } from "virtual:docs-content"

import type {
  DocumentEntry,
  DocumentFrontmatter,
  VirtualDocumentEntry,
} from "./types"

function fallbackTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
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
    description:
      typeof value.description === "string" && value.description.trim()
        ? value.description.trim()
        : undefined,
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

export function getDocument(slug: string) {
  return documentsBySlug.get(slug)
}

export function getDocuments() {
  return documents
}
