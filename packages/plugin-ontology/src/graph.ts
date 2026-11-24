export type NonEmptyList<T> = readonly [T, ...T[]]
export interface OntologyDocumentFilter {
  documentType?: string | readonly string[]
  slugs?: readonly string[]
  tags?: { any?: NonEmptyList<string>; all?: NonEmptyList<string> }
  and?: NonEmptyList<OntologyDocumentFilter>
  or?: NonEmptyList<OntologyDocumentFilter>
}
export interface OntologyProps {
  subjectFilter: OntologyDocumentFilter
  extensionMaxHops?: number
  extensionFilter?: OntologyDocumentFilter
}
export interface GraphDocument {
  slug: string
  frontmatter: {
    title: string
    type?: string
    tags: readonly string[]
    relations?: readonly {
      subjectEnd: "none" | "arrow"
      relatedEnd: "none" | "arrow"
      relationSlug: string
      relatedDoc: string
      description?: string
    }[]
  }
}
export function matchesFilter(
  doc: GraphDocument,
  filter: OntologyDocumentFilter
): boolean {
  const type = filter.documentType
  return (
    (type === undefined ||
      (typeof type === "string" ? [type] : type).includes(
        doc.frontmatter.type ?? ""
      )) &&
    (filter.slugs === undefined || filter.slugs.includes(doc.slug)) &&
    (filter.tags?.any === undefined ||
      filter.tags.any.some((tag) => doc.frontmatter.tags.includes(tag))) &&
    (filter.tags?.all === undefined ||
      filter.tags.all.every((tag) => doc.frontmatter.tags.includes(tag))) &&
    (filter.and === undefined ||
      filter.and.every((f) => matchesFilter(doc, f))) &&
    (filter.or === undefined || filter.or.some((f) => matchesFilter(doc, f)))
  )
}
export function selectGraph(
  documents: readonly GraphDocument[],
  props: OntologyProps
) {
  const hops = props.extensionMaxHops ?? 0
  if (!Number.isInteger(hops) || hops < 0)
    throw new Error("extensionMaxHops must be a non-negative integer")
  const bySlug = new Map(documents.map((d) => [d.slug, d]))
  const edges = documents.flatMap((d) =>
    (d.frontmatter.relations ?? []).map((r, index) => ({
      ...r,
      id: JSON.stringify([d.slug, index]),
      subject: d.slug,
    }))
  )
  const adjacent = new Map<string, string[]>()
  for (const edge of edges) {
    for (const [a, b] of [
      [edge.subject, edge.relatedDoc],
      [edge.relatedDoc, edge.subject],
    ]) {
      const neighbors = adjacent.get(a) ?? []
      neighbors.push(b)
      adjacent.set(a, neighbors)
    }
  }
  const subjects = new Set(
    documents
      .filter((d) => matchesFilter(d, props.subjectFilter))
      .map((d) => d.slug)
  )
  const visible = new Set(subjects)
  let frontier = [...subjects]
  for (let depth = 0; depth < hops && frontier.length; depth++) {
    const next: string[] = []
    for (const slug of frontier) {
      for (const neighbor of adjacent.get(slug) ?? []) {
        if (visible.has(neighbor)) continue
        const doc = bySlug.get(neighbor)
        if (!doc || !matchesFilter(doc, props.extensionFilter ?? {})) continue
        visible.add(neighbor)
        next.push(neighbor)
      }
    }
    frontier = next
  }
  return {
    subjects,
    documents: documents.filter((d) => visible.has(d.slug)),
    edges: edges.filter(
      (e) => visible.has(e.subject) && visible.has(e.relatedDoc)
    ),
  }
}
