import { useMemo } from "react"
import { GitFork, ListTree, Tag } from "lucide-react"
import { Link, NavLink, useSearchParams } from "react-router"

import type { DocumentEntry, TagDefinition } from "../content/types"
import { DocsSearchInput } from "./docs-search-input"
import { DocsShell } from "./document-page"

interface TagWithCount extends TagDefinition {
  documentCount: number
}

interface GraphNode extends TagWithCount {
  x: number
  y: number
  radius: number
}

interface GraphEdge {
  from: string
  to: string
  weight: number
  hierarchy: boolean
}

function tagQueryHref(slug: string) {
  const params = new URLSearchParams({ q: `tag:${slug}` })
  return `/list?${params.toString()}`
}

function tagsWithCounts(tags: TagDefinition[], documents: DocumentEntry[]) {
  return tags.map((tag) => ({
    ...tag,
    documentCount: documents.filter((document) =>
      document.frontmatter.tags.some(
        (documentTag) =>
          documentTag === tag.slug || documentTag.startsWith(`${tag.slug}/`)
      )
    ).length,
  }))
}

function filterTags(tags: TagWithCount[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return tags

  const matchingSlugs = tags
    .filter((tag) =>
      [tag.title, tag.description, tag.slug].some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery)
      )
    )
    .map((tag) => tag.slug)

  return tags.filter((tag) =>
    matchingSlugs.some(
      (slug) =>
        tag.slug === slug ||
        tag.slug.startsWith(`${slug}/`) ||
        slug.startsWith(`${tag.slug}/`)
    )
  )
}

function flattenTagTree(tags: TagWithCount[]) {
  const tagsBySlug = new Map(tags.map((tag) => [tag.slug, tag]))
  const children = new Map<string | undefined, TagWithCount[]>()

  for (const tag of tags) {
    const parent =
      tag.parentSlug && tagsBySlug.has(tag.parentSlug)
        ? tag.parentSlug
        : undefined
    const siblings = children.get(parent) ?? []
    siblings.push(tag)
    children.set(parent, siblings)
  }

  for (const siblings of children.values()) {
    siblings.sort((left, right) => left.title.localeCompare(right.title))
  }

  const flattened: Array<{ tag: TagWithCount; depth: number }> = []
  function visit(parent: string | undefined, depth: number) {
    for (const tag of children.get(parent) ?? []) {
      flattened.push({ tag, depth })
      visit(tag.slug, depth + 1)
    }
  }
  visit(undefined, 0)

  return flattened
}

function TagsTree({ tags }: { tags: TagWithCount[] }) {
  const flattenedTags = useMemo(() => flattenTagTree(tags), [tags])

  if (!flattenedTags.length) return <EmptyTags />

  return (
    <ul className="divide-y" aria-label="Tag hierarchy">
      {flattenedTags.map(({ tag, depth }) => (
        <li key={tag.slug}>
          <Link
            to={tagQueryHref(tag.slug)}
            className="group grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-3 py-4 transition-colors hover:bg-muted/50 sm:px-5"
          >
            <span
              className="flex min-w-0 items-start gap-3"
              style={{ paddingInlineStart: `${depth * 1.5}rem` }}
            >
              <span
                className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"
                style={
                  tag.color
                    ? {
                        borderColor: tag.color,
                        color: tag.color,
                      }
                    : undefined
                }
              >
                <Tag className="size-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="font-medium group-hover:text-primary">
                  {tag.title}
                </span>
                {tag.description ? (
                  <span className="mt-0.5 block text-sm leading-6 text-muted-foreground">
                    {tag.description}
                  </span>
                ) : null}
              </span>
            </span>
            <span className="mt-1 min-w-7 text-right text-sm text-muted-foreground tabular-nums">
              {tag.documentCount}
              <span className="sr-only">
                {tag.documentCount === 1 ? " document" : " documents"}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function createGraph(tags: TagWithCount[], documents: DocumentEntry[]) {
  const width = 800
  const height = 460
  const centerX = width / 2
  const centerY = height / 2
  const orbitX = width * 0.37
  const orbitY = height * 0.34
  const sortedTags = [...tags].sort((left, right) =>
    left.slug.localeCompare(right.slug)
  )
  const nodes: GraphNode[] = sortedTags.map((tag, index) => {
    const angle =
      (index / Math.max(sortedTags.length, 1)) * Math.PI * 2 - Math.PI / 2
    return {
      ...tag,
      x: centerX + Math.cos(angle) * orbitX,
      y: centerY + Math.sin(angle) * orbitY,
      radius: Math.min(34, 18 + Math.sqrt(tag.documentCount) * 5),
    }
  })
  const visibleSlugs = new Set(nodes.map((node) => node.slug))
  const edgeMap = new Map<string, GraphEdge>()

  function addEdge(from: string, to: string, hierarchy = false) {
    if (from === to || !visibleSlugs.has(from) || !visibleSlugs.has(to)) return
    const [first, second] = [from, to].sort()
    const key = `${first}\0${second}`
    const existing = edgeMap.get(key)
    edgeMap.set(key, {
      from: first,
      to: second,
      hierarchy: hierarchy || Boolean(existing?.hierarchy),
      weight: (existing?.weight ?? 0) + 1,
    })
  }

  for (const tag of nodes) {
    if (tag.parentSlug) addEdge(tag.parentSlug, tag.slug, true)
  }

  for (const document of documents) {
    const documentTags = document.frontmatter.tags.filter((tag) =>
      visibleSlugs.has(tag)
    )
    for (let index = 0; index < documentTags.length; index += 1) {
      for (
        let peerIndex = index + 1;
        peerIndex < documentTags.length;
        peerIndex += 1
      ) {
        addEdge(documentTags[index], documentTags[peerIndex])
      }
    }
  }

  return { width, height, nodes, edges: [...edgeMap.values()] }
}

function TagsGraph({
  tags,
  documents,
}: {
  tags: TagWithCount[]
  documents: DocumentEntry[]
}) {
  const graph = useMemo(() => createGraph(tags, documents), [documents, tags])
  const nodesBySlug = new Map(graph.nodes.map((node) => [node.slug, node]))

  if (!graph.nodes.length) return <EmptyTags />

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <svg
        viewBox={`0 0 ${graph.width} ${graph.height}`}
        className="h-auto min-h-96 w-full"
        role="img"
        aria-labelledby="tag-graph-title tag-graph-description"
      >
        <title id="tag-graph-title">Tag relationships</title>
        <desc id="tag-graph-description">
          Tags are connected when they share a document or have a parent-child
          relationship.
        </desc>
        <g aria-hidden="true">
          {graph.edges.map((edge) => {
            const from = nodesBySlug.get(edge.from)
            const to = nodesBySlug.get(edge.to)
            if (!from || !to) return null

            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={
                  edge.hierarchy ? "stroke-primary/45" : "stroke-border"
                }
                strokeWidth={edge.hierarchy ? 2 : Math.min(3, edge.weight)}
              />
            )
          })}
        </g>
        {graph.nodes.map((node) => (
          <a
            key={node.slug}
            href={tagQueryHref(node.slug)}
            aria-label={`${node.title}, ${node.documentCount} documents`}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={node.color ?? "var(--primary)"}
              className="opacity-90 transition-opacity hover:opacity-100"
            />
            <text
              x={node.x}
              y={node.y + node.radius + 17}
              textAnchor="middle"
              className="fill-foreground text-[12px] font-medium"
            >
              {node.title}
            </text>
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor="middle"
              className="fill-primary-foreground text-[12px] font-semibold"
            >
              {node.documentCount}
            </text>
          </a>
        ))}
      </svg>
      <ul className="sr-only">
        {graph.nodes.map((node) => (
          <li key={node.slug}>
            <Link to={tagQueryHref(node.slug)}>{node.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmptyTags() {
  return (
    <div className="rounded-xl border py-16 text-center">
      <h2 className="font-semibold">No tags found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Try another search term.
      </p>
    </div>
  )
}

export function TagsPage({
  documents,
  tags,
  view,
}: {
  documents: DocumentEntry[]
  tags: TagDefinition[]
  view: "tree" | "graph"
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("q") ?? ""
  const countedTags = useMemo(
    () => tagsWithCounts(tags, documents),
    [documents, tags]
  )
  const visibleTags = useMemo(
    () => filterTags(countedTags, query),
    [countedTags, query]
  )

  function updateQuery(nextQuery: string) {
    const nextParams = new URLSearchParams(searchParams)
    if (nextQuery) nextParams.set("q", nextQuery)
    else nextParams.delete("q")
    setSearchParams(nextParams, { preventScrollReset: true, replace: true })
  }

  function viewHref(nextView: "tree" | "graph") {
    const serializedParams = searchParams.toString()
    return `/tags/${nextView}${serializedParams ? `?${serializedParams}` : ""}`
  }

  const viewClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-background text-foreground shadow-xs"
        : "text-muted-foreground hover:text-foreground"
    }`

  return (
    <DocsShell>
      <main className="mx-auto w-full px-6 py-8 sm:px-11 sm:py-12">
        <nav
          className="mb-8 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="transition-colors hover:text-foreground">
            Docs
          </Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <span className="text-foreground">Tags</span>
        </nav>

        <section aria-labelledby="tags-heading">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Browse</p>
              <h1
                id="tags-heading"
                className="mt-1 text-3xl font-semibold tracking-tight"
              >
                Tags
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                Views
              </span>
              <nav
                className="flex rounded-lg bg-muted p-1"
                aria-label="Tag views"
              >
                <NavLink to={viewHref("tree")} className={viewClass}>
                  <ListTree className="size-4" aria-hidden="true" />
                  Tree
                </NavLink>
                <NavLink to={viewHref("graph")} className={viewClass}>
                  <GitFork className="size-4" aria-hidden="true" />
                  Graph
                </NavLink>
              </nav>
            </div>
          </div>

          <div className="mt-6 rounded-xl border bg-card p-4 shadow-xs">
            <DocsSearchInput
              value={query}
              onValueChange={updateQuery}
              onSubmit={() => undefined}
              label="Search tags"
              placeholder="Search tags"
            />
          </div>

          <div className="mt-8 flex items-center justify-between border-b pb-4">
            <p className="text-sm text-muted-foreground">
              {visibleTags.length} {visibleTags.length === 1 ? "tag" : "tags"}
            </p>
            <p className="text-sm text-muted-foreground">Documents</p>
          </div>

          <div className="mt-2">
            {view === "tree" ? (
              <TagsTree tags={visibleTags} />
            ) : (
              <TagsGraph tags={visibleTags} documents={documents} />
            )}
          </div>
        </section>
      </main>
    </DocsShell>
  )
}
