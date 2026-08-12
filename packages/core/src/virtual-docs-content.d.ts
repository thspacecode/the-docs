declare module "virtual:docs-content" {
  import type { LucideIcon } from "lucide-react"

  import type {
    VirtualDocumentEntry,
    VirtualScopeDefinition,
    VirtualTagDefinition,
    VirtualTypeDefinition,
  } from "./content/types.js"

  export const documents: VirtualDocumentEntry[]
  export const scopes: VirtualScopeDefinition[]
  export const scopeIcons: Record<string, LucideIcon>
  export const tags: VirtualTagDefinition[]
  export const types: VirtualTypeDefinition[]
}
