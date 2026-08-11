import type { MDXContent } from "mdx/types"

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
}

export interface VirtualDocumentEntry {
  slug: string
  Component: MdxDocumentComponent
  frontmatter: Record<string, unknown>
  searchText: string
}
