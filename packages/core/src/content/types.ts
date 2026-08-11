import type { MDXContent } from "mdx/types"

export type MdxDocumentComponent = MDXContent

export interface DocumentFrontmatter {
  title: string
  description?: string
  tags: string[]
}

export interface DocumentEntry {
  slug: string
  Component: MdxDocumentComponent
  frontmatter: DocumentFrontmatter
}

export interface VirtualDocumentEntry {
  slug: string
  Component: MdxDocumentComponent
  frontmatter: Record<string, unknown>
}
