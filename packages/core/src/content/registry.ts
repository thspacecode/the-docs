/// <reference path="../virtual-docs-content.d.ts" />

import {
  documents as virtualDocuments,
  scopeIcons as virtualScopeIcons,
  scopes as virtualScopes,
  tags as virtualTags,
  types as virtualTypes,
} from "virtual:docs-content"

import type {
  DocumentEntry,
  DocumentFrontmatter,
  ScopeDefinition,
  ScopeDocumentReference,
  ScopeGroupDefinition,
  RelatedDocumentEntry,
  RelatedDocumentsSection,
  ScopeSectionDefinition,
  TagDefinition,
  TypeDefinition,
  VirtualDocumentEntry,
  VirtualScopeDefinition,
  VirtualTagDefinition,
  VirtualTypeDefinition,
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

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function optionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value !== "string" || !value.trim()) return undefined

  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function timestamp(value: unknown) {
  if (value instanceof Date) return value.getTime()
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value !== "string" || !value.trim()) return undefined

  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? [
        ...new Set(
          value
            .filter((entry): entry is string => typeof entry === "string")
            .map((entry) => entry.trim())
            .filter(Boolean)
        ),
      ]
    : []
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
    tags: stringArray(value.tags),
    type: optionalString(value.type),
    scope: optionalString(value.scope),
    importance: optionalString(value.importance),
    priority: optionalNumber(value.priority),
    relatedDocs: stringArray(value["related-docs"] ?? value.relatedDocs),
  }
}

function normalizeDocumentReference(
  value: unknown
): ScopeDocumentReference | undefined {
  const definition = objectValue(value)
  const slug = optionalString(definition?.slug)

  return slug
    ? {
        slug,
        icon: optionalString(definition?.icon),
      }
    : undefined
}

function normalizeDocumentReferences(value: unknown) {
  return Array.isArray(value)
    ? value
        .map(normalizeDocumentReference)
        .filter((reference): reference is ScopeDocumentReference =>
          Boolean(reference)
        )
    : []
}

function normalizeGroup(
  value: unknown,
  index: number
): ScopeGroupDefinition | undefined {
  const definition = objectValue(value)
  if (!definition) return undefined

  return {
    id: optionalString(definition.id) ?? `group-${index + 1}`,
    title: optionalString(definition.title),
    description: optionalString(definition.description),
    icon: optionalString(definition.icon),
    document: normalizeDocumentReference(definition.document),
    documents: normalizeDocumentReferences(definition.documents),
  }
}

function normalizeSection(
  value: unknown,
  index: number
): ScopeSectionDefinition | undefined {
  const definition = objectValue(value)
  if (!definition) return undefined

  const id = optionalString(definition.id) ?? `section-${index + 1}`

  return {
    id,
    title: optionalString(definition.title) ?? fallbackTitle(id),
    description: optionalString(definition.description),
    icon: optionalString(definition.icon),
    documents: normalizeDocumentReferences(definition.documents),
    groups: Array.isArray(definition.groups)
      ? definition.groups
          .map(normalizeGroup)
          .filter((group): group is ScopeGroupDefinition => Boolean(group))
      : [],
  }
}

const scopes = ((virtualScopes ?? []) as VirtualScopeDefinition[]).map(
  ({ slug, definition }): ScopeDefinition => ({
    slug,
    title: optionalString(definition.title) ?? fallbackTitle(slug),
    description: optionalString(definition.description) ?? "",
    icon: optionalString(definition.icon),
    sections: Array.isArray(definition.sections)
      ? definition.sections
          .map(normalizeSection)
          .filter((section): section is ScopeSectionDefinition =>
            Boolean(section)
          )
      : [],
  })
)

export function scopeDocumentSlugs(scope: ScopeDefinition) {
  return [
    ...new Set(
      scope.sections.flatMap((section) => [
        ...section.documents.map(({ slug }) => slug),
        ...section.groups.flatMap((group) => [
          ...(group.document ? [group.document.slug] : []),
          ...group.documents.map(({ slug }) => slug),
        ]),
      ])
    ),
  ]
}

export function scopeContainsDocument(
  scope: ScopeDefinition,
  documentSlug: string
) {
  return scopeDocumentSlugs(scope).includes(documentSlug)
}

const scopeSlugsByDocument = new Map<string, string[]>()

for (const scope of scopes) {
  for (const documentSlug of scopeDocumentSlugs(scope)) {
    const memberships = scopeSlugsByDocument.get(documentSlug) ?? []
    memberships.push(scope.slug)
    scopeSlugsByDocument.set(documentSlug, memberships)
  }
}

const documents = (virtualDocuments as VirtualDocumentEntry[]).map(
  (document): DocumentEntry => ({
    ...document,
    frontmatter: normalizeFrontmatter(document.slug, document.frontmatter),
    modifiedAt:
      timestamp(
        document.frontmatter.modified ??
          document.frontmatter["modified-at"] ??
          document.frontmatter.modifiedAt
      ) ??
      document.modifiedAt ??
      0,
    scopeSlugs: scopeSlugsByDocument.get(document.slug) ?? [],
  })
)

const documentsBySlug = new Map(
  documents.map((document) => [document.slug, document])
)
const scopesBySlug = new Map(scopes.map((scope) => [scope.slug, scope]))

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

const types = ((virtualTypes ?? []) as VirtualTypeDefinition[]).map(
  ({ slug, definition }): TypeDefinition => ({
    slug,
    title: optionalString(definition.title) ?? fallbackTitle(slug),
    description: optionalString(definition.description) ?? "",
    color: optionalString(definition.color),
    separateRelatedDocsSection: Boolean(
      definition.separateRelatedDocsSection ??
      definition["separate-related-docs-section"] ??
      definition["separate-related-docs-sections"] ??
      definition["seperate-related-docs-sections"]
    ),
  })
)
const typesBySlug = new Map(types.map((type) => [type.slug, type]))

const importancePriorities: Record<string, number> = {
  highest: 5,
  high: 4,
  medium: 3,
  low: 2,
  lowest: 1,
}

function documentPriority(document: DocumentEntry) {
  if (document.frontmatter.priority !== undefined) {
    return document.frontmatter.priority
  }

  return document.frontmatter.importance
    ? (importancePriorities[document.frontmatter.importance.toLowerCase()] ?? 0)
    : 0
}

function compareRelatedDocuments(
  left: RelatedDocumentEntry,
  right: RelatedDocumentEntry
) {
  return (
    Number(right.directlyLinked) - Number(left.directlyLinked) ||
    documentPriority(right.document) - documentPriority(left.document) ||
    right.document.modifiedAt - left.document.modifiedAt ||
    left.document.frontmatter.title.localeCompare(
      right.document.frontmatter.title
    )
  )
}

export function getRelatedDocumentSections(
  slug: string
): RelatedDocumentsSection[] {
  const document = documentsBySlug.get(slug)
  if (!document) return []

  const directlyLinkedSlugs = new Set(document.frontmatter.relatedDocs)
  const relatedEntries = documents
    .filter(
      (candidate) =>
        candidate.slug !== slug &&
        (directlyLinkedSlugs.has(candidate.slug) ||
          candidate.frontmatter.relatedDocs.includes(slug))
    )
    .map(
      (relatedDocument): RelatedDocumentEntry => ({
        document: relatedDocument,
        directlyLinked: directlyLinkedSlugs.has(relatedDocument.slug),
      })
    )
    .sort(compareRelatedDocuments)

  const defaultEntries: RelatedDocumentEntry[] = []
  const separateEntries = new Map<string, RelatedDocumentEntry[]>()

  for (const entry of relatedEntries) {
    const typeSlug = entry.document.frontmatter.type
    const type = typeSlug ? typesBySlug.get(typeSlug) : undefined

    if (!type?.separateRelatedDocsSection) {
      defaultEntries.push(entry)
      continue
    }

    const entries = separateEntries.get(type.slug) ?? []
    entries.push(entry)
    separateEntries.set(type.slug, entries)
  }

  const sections: RelatedDocumentsSection[] = []
  if (defaultEntries.length) {
    sections.push({
      id: "related-docs",
      title: "Related docs",
      defaultExpanded: true,
      entries: defaultEntries,
    })
  }

  for (const [typeSlug, entries] of separateEntries) {
    const type = typesBySlug.get(typeSlug)
    if (!type) continue

    sections.push({
      id: `related-docs-${typeSlug}`,
      title: type.title,
      defaultExpanded: false,
      entries,
    })
  }

  return sections
}

export function getDocument(slug: string) {
  return documentsBySlug.get(slug)
}

export function getDocuments() {
  return documents
}

export function getScope(slug: string) {
  return scopesBySlug.get(slug)
}

export function getScopeIcon(name: string) {
  return virtualScopeIcons?.[name]
}

export function getScopes() {
  return scopes
}

export function getTags() {
  return tags
}

export function getTypes() {
  return types
}
