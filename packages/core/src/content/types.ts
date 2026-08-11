import type { MDXContent } from "mdx/types"

import type { TableOfContentsItem } from "./table-of-contents"

export type MdxDocumentComponent = MDXContent

export interface DocumentFrontmatter {
  title: string
  description?: string
  tags: string[]
  type?: string
  scope?: string
  importance?: string
  priority?: number
  relatedDocs: string[]
}

export interface DocumentEntry {
  slug: string
  Component: MdxDocumentComponent
  frontmatter: DocumentFrontmatter
  modifiedAt: number
  scopeSlugs: string[]
  searchText: string
  tableOfContents: TableOfContentsItem[]
}

export interface RelatedDocumentEntry {
  document: DocumentEntry
  directlyLinked: boolean
}

export interface RelatedDocumentsSection {
  id: string
  title: string
  defaultExpanded: boolean
  entries: RelatedDocumentEntry[]
}

export interface TagDefinition {
  slug: string
  parentSlug?: string
  title: string
  description: string
  color?: string
}

export interface ScopeDocumentReference {
  slug: string
  icon?: string
}

export interface ScopeGroupDefinition {
  id: string
  title?: string
  description?: string
  icon?: string
  document?: ScopeDocumentReference
  documents: ScopeDocumentReference[]
}

export interface ScopeSectionDefinition {
  id: string
  title: string
  description?: string
  icon?: string
  documents: ScopeDocumentReference[]
  groups: ScopeGroupDefinition[]
}

export interface ScopeDefinition {
  slug: string
  title: string
  description: string
  icon?: string
  sections: ScopeSectionDefinition[]
}

export interface VirtualScopeDefinition {
  slug: string
  definition: Record<string, unknown>
}

export interface TypeDefinition {
  slug: string
  title: string
  description: string
  color?: string
  separateRelatedDocsSection: boolean
}

export interface VirtualTagDefinition {
  slug: string
  parentSlug?: string
  definition: Record<string, unknown>
}

export interface VirtualTypeDefinition {
  slug: string
  definition: Record<string, unknown>
}

export interface VirtualDocumentEntry {
  slug: string
  Component: MdxDocumentComponent
  frontmatter: Record<string, unknown>
  modifiedAt: number
  searchText: string
  tableOfContents: TableOfContentsItem[]
}
