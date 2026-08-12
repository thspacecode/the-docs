import { Dialog } from "@base-ui/react/dialog"
import Fuse from "fuse.js"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  CornerDownLeft,
  FileText,
  Layers3,
  Search,
  Tag,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"

import type {
  DocumentEntry,
  ScopeDefinition,
  TagDefinition,
} from "../content/types.js"

type SearchResultKind = "document" | "scope" | "tag"

interface GlobalSearchResult {
  id: string
  kind: SearchResultKind
  title: string
  description: string
  keywords: string
  href: string
}

const maximumResultCount = 12
const resultListId = "global-search-results"

const resultKindLabels: Record<SearchResultKind, string> = {
  document: "Document",
  scope: "Scope",
  tag: "Tag",
}

function tagHref(slug: string) {
  const value = /\s/.test(slug) ? `"${slug}"` : slug
  return `/list?${new URLSearchParams({ q: `tag:${value}` }).toString()}`
}

function createSearchResults(
  documents: DocumentEntry[],
  scopes: ScopeDefinition[],
  tags: TagDefinition[]
) {
  const documentResults: GlobalSearchResult[] = [...documents]
    .sort((left, right) => right.modifiedAt - left.modifiedAt)
    .map((document) => ({
      id: `document:${document.slug}`,
      kind: "document",
      title: document.frontmatter.title,
      description:
        document.frontmatter.description ||
        document.frontmatter.tags.join(" · "),
      keywords: [
        document.searchText,
        ...document.frontmatter.tags,
        ...document.scopeSlugs,
      ].join(" "),
      href: `/p/${document.slug}`,
    }))

  const scopeResults: GlobalSearchResult[] = scopes.map((scope) => {
    const documentCount = documents.filter((document) =>
      document.scopeSlugs.includes(scope.slug)
    ).length

    return {
      id: `scope:${scope.slug}`,
      kind: "scope",
      title: scope.title,
      description:
        scope.description ||
        `${documentCount} ${documentCount === 1 ? "document" : "documents"}`,
      keywords: scope.sections
        .flatMap((section) => [
          section.title,
          section.description ?? "",
          ...section.documents.map(({ slug }) => slug),
          ...section.groups.flatMap((group) => [
            group.title ?? "",
            group.description ?? "",
            ...(group.document ? [group.document.slug] : []),
            ...group.documents.map(({ slug }) => slug),
          ]),
        ])
        .join(" "),
      href: `/scopes/${scope.slug}`,
    }
  })

  const tagResults: GlobalSearchResult[] = tags.map((tag) => {
    const documentCount = documents.filter((document) =>
      document.frontmatter.tags.includes(tag.slug)
    ).length

    return {
      id: `tag:${tag.slug}`,
      kind: "tag",
      title: tag.title,
      description:
        tag.description ||
        `${documentCount} ${documentCount === 1 ? "document" : "documents"}`,
      keywords: [tag.slug, tag.parentSlug ?? ""].join(" "),
      href: tagHref(tag.slug),
    }
  })

  return [...documentResults, ...scopeResults, ...tagResults]
}

function defaultSearchResults(results: GlobalSearchResult[]) {
  const limits: Record<SearchResultKind, number> = {
    document: 5,
    scope: 3,
    tag: 4,
  }
  const selected = results.filter((result, index) => {
    const sameKindBefore = results
      .slice(0, index)
      .filter(({ kind }) => kind === result.kind).length
    return sameKindBefore < limits[result.kind]
  })

  if (selected.length >= maximumResultCount) {
    return selected.slice(0, maximumResultCount)
  }

  const selectedIds = new Set(selected.map(({ id }) => id))
  return [
    ...selected,
    ...results.filter(({ id }) => !selectedIds.has(id)),
  ].slice(0, maximumResultCount)
}

function ResultIcon({ kind }: { kind: SearchResultKind }) {
  const Icon = kind === "document" ? FileText : kind === "scope" ? Layers3 : Tag
  return <Icon className="size-4" aria-hidden="true" />
}

export function GlobalSearch({
  open,
  onOpenChange,
  documents,
  scopes,
  tags,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  documents: DocumentEntry[]
  scopes: ScopeDefinition[]
  tags: TagDefinition[]
}) {
  const navigate = useNavigate()
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchResults = useMemo(
    () => createSearchResults(documents, scopes, tags),
    [documents, scopes, tags]
  )
  const searchIndex = useMemo(
    () =>
      new Fuse(searchResults, {
        ignoreLocation: true,
        minMatchCharLength: 1,
        threshold: 0.35,
        keys: [
          { name: "title", weight: 0.55 },
          { name: "description", weight: 0.2 },
          { name: "keywords", weight: 0.25 },
        ],
      }),
    [searchResults]
  )
  const visibleResults = useMemo(() => {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) return defaultSearchResults(searchResults)

    return searchIndex
      .search(normalizedQuery)
      .map(({ item }) => item)
      .slice(0, maximumResultCount)
  }, [query, searchIndex, searchResults])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const selectedResult = listRef.current?.querySelector(
      '[data-selected="true"]'
    )
    selectedResult?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  function close() {
    onOpenChange(false)
    setQuery("")
    setSelectedIndex(0)
  }

  function openResult(result: GlobalSearchResult) {
    close()
    navigate(result.href)
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setQuery("")
      setSelectedIndex(0)
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!visibleResults.length) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setSelectedIndex((index) => (index + 1) % visibleResults.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setSelectedIndex(
        (index) => (index - 1 + visibleResults.length) % visibleResults.length
      )
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      const selectedResult = visibleResults[selectedIndex]
      if (selectedResult) openResult(selectedResult)
    }
  }

  const activeResult = visibleResults[selectedIndex]

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-black/55 supports-[-webkit-touch-callout:none]:absolute" />
        <Dialog.Popup className="fixed top-[max(1rem,10svh)] left-1/2 z-50 flex max-h-[min(42rem,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl outline-none">
          <Dialog.Title className="sr-only">
            Search all documentation
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Search documents, tags, and scopes. Use the arrow keys to navigate
            results.
          </Dialog.Description>

          <div className="flex h-16 shrink-0 items-center gap-3 border-b px-5">
            <Search
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search documents, tags, and scopes..."
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              role="combobox"
              aria-autocomplete="list"
              aria-controls={resultListId}
              aria-expanded="true"
              aria-activedescendant={
                activeResult ? `global-search-${activeResult.id}` : undefined
              }
            />
            <kbd className="rounded-md border bg-muted px-2 py-1 font-sans text-[0.7rem] text-muted-foreground">
              Esc
            </kbd>
          </div>

          <div
            ref={listRef}
            id={resultListId}
            role="listbox"
            aria-label="Search results"
            className="min-h-0 flex-1 overflow-y-auto p-2"
          >
            {visibleResults.length ? (
              visibleResults.map((result, index) => {
                const selected = index === selectedIndex

                return (
                  <button
                    key={result.id}
                    id={`global-search-${result.id}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-selected={selected}
                    onMouseMove={() => setSelectedIndex(index)}
                    onClick={() => openResult(result)}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-grey-9/40 data-[selected=true]:bg-muted"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground group-data-[selected=true]:border-grey-8 group-data-[selected=true]:text-foreground">
                      <ResultIcon kind={result.kind} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {result.title}
                        </span>
                        <span className="shrink-0 text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                          {resultKindLabels[result.kind]}
                        </span>
                      </span>
                      {result.description ? (
                        <span className="mt-0.5 line-clamp-1 block text-sm text-muted-foreground">
                          {result.description}
                        </span>
                      ) : null}
                    </span>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100"
                      aria-hidden="true"
                    />
                  </button>
                )
              })
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                <Search
                  className="size-8 text-muted-foreground/60"
                  aria-hidden="true"
                />
                <p className="mt-4 font-medium">No results found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a document title, tag, or scope.
                </p>
              </div>
            )}
          </div>

          <div className="hidden min-h-12 shrink-0 items-center gap-5 border-t bg-grey-2 px-5 text-xs text-muted-foreground sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex gap-0.5 rounded border bg-background p-1">
                <ArrowUp className="size-3" aria-hidden="true" />
                <ArrowDown className="size-3" aria-hidden="true" />
              </kbd>
              Navigate
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="rounded border bg-background p-1">
                <CornerDownLeft className="size-3" aria-hidden="true" />
              </kbd>
              Open
            </span>
            <span className="ml-auto">{visibleResults.length} results</span>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
