export interface DocumentRelation {
  subjectEnd: "none" | "arrow"
  relatedEnd: "none" | "arrow"
  relationSlug: string
  relatedDoc: string
  description?: string
}

export interface RelationDefinition {
  slug: string
  title: string
  description?: string
}

export function validateRelations(
  value: unknown,
  subject: string,
  documents: ReadonlySet<string>,
  relations: ReadonlySet<string>,
  filePath: string
): asserts value is DocumentRelation[] | undefined {
  const fail = (message: string): never => {
    throw new Error(`${filePath}: frontmatter relations ${message}`)
  }
  if (value === undefined) return
  if (!Array.isArray(value)) fail("must be an array")
  const seen = new Set<string>()
  for (const [index, entry] of (value as unknown[]).entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      fail(`[${index}] must be an object`)
    const r = entry as Record<string, unknown>
    if (
      !["none", "arrow"].includes(r.subjectEnd as string) ||
      !["none", "arrow"].includes(r.relatedEnd as string)
    )
      fail(`[${index}] endpoints must be none or arrow`)
    if (typeof r.relatedDoc !== "string" || !documents.has(r.relatedDoc))
      fail(`[${index}] references unknown document ${String(r.relatedDoc)}`)
    if (r.relatedDoc === subject)
      fail(`[${index}] cannot reference its own document`)
    if (typeof r.relationSlug !== "string" || !relations.has(r.relationSlug))
      fail(`[${index}] references unknown relation ${String(r.relationSlug)}`)
    if (r.description !== undefined && typeof r.description !== "string")
      fail(`[${index}] description must be a string`)
    const key = JSON.stringify([
      r.subjectEnd,
      r.relatedEnd,
      r.relationSlug,
      r.relatedDoc,
      r.description ?? "",
    ])
    if (seen.has(key)) fail(`[${index}] duplicates a relation`)
    seen.add(key)
  }
}
