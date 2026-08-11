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
}

export interface DocumentEntry {
  slug: string
  Component: MdxDocumentComponent
  frontmatter: DocumentFrontmatter
  searchText: string
  tableOfContents: TableOfContentsItem[]
}

export interface TagDefinition {
  slug: string
  parentSlug?: string
  title: string
  description: string
  color?: string
}

export interface VirtualTagDefinition {
  slug: string
  parentSlug?: string
  definition: Record<string, unknown>
}

export interface VirtualDocumentEntry {
  slug: string
  Component: MdxDocumentComponent
  frontmatter: Record<string, unknown>
  searchText: string
  tableOfContents: TableOfContentsItem[]
}
