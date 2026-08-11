declare module "virtual:docs-content" {
  import type {
    VirtualDocumentEntry,
    VirtualTagDefinition,
  } from "./content/types"

  export const documents: VirtualDocumentEntry[]
  export const tags: VirtualTagDefinition[]
}
