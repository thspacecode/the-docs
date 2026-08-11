import { useEffect, useMemo, useState } from "react"
import { Combobox } from "@base-ui/react/combobox"
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowRight,
  ArrowUpNarrowWide,
  ArrowUpRight,
  Check,
  ChevronDown,
  Search,
} from "lucide-react"
import { Link, useSearchParams } from "react-router"

import type { DocumentEntry } from "../content/types"
import {
  DocumentSearchIndex,
  parseSearchQuery,
  setSearchQualifiers,
  type SearchQualifier,
} from "../search/document-search"
import { DocsSearchInput } from "./docs-search-input"
import { DocsShell } from "./document-page"

const pageSize = 6
const searchDelay = 150

function pageFromSearchParams(searchParams: URLSearchParams) {
  const value = Number(searchParams.get("page"))
  return Number.isInteger(value) && value > 0 ? value : 1
}

function uniqueMetadata(
  documents: DocumentEntry[],
  field: "importance" | "type"
) {
  return [
    ...new Set(
      documents
        .map((document) => document.frontmatter[field])
        .filter((value): value is string => Boolean(value))
    ),
  ].sort((left, right) => left.localeCompare(right))
}

interface FilterOption {
  label: string
  value: string
}

function FilterCombobox({
  label,
  qualifier,
  values,
  options,
  onChange,
}: {
  label: string
  qualifier: SearchQualifier
  values: string[]
  options: string[]
  onChange: (qualifier: SearchQualifier, values: string[]) => void
}) {
  const items: FilterOption[] = [
    { label: `All ${label.toLocaleLowerCase()}`, value: "" },
    ...options.map((option) => ({
      label: option,
      value: option.toLocaleLowerCase(),
    })),
  ]
  const normalizedValues = new Set(
    values.map((value) => value.toLocaleLowerCase())
  )
  const selectedItems = values.length
    ? items.filter((item) => item.value && normalizedValues.has(item.value))
    : [items[0]]

  function updateValues(nextItems: FilterOption[]) {
    const nextValues = nextItems.map((item) => item.value)

    if (nextValues.includes("")) {
      onChange(
        qualifier,
        values.length ? [] : nextValues.filter((value) => value)
      )
      return
    }

    onChange(qualifier, nextValues)
  }

  return (
    <Combobox.Root
      multiple
      items={items}
      value={selectedItems}
      onValueChange={updateValues}
      isItemEqualToValue={(item, selected) => item.value === selected.value}
    >
      <Combobox.Trigger
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 data-[popup-open]:bg-muted ${
          values.length ? "bg-primary/10 text-primary" : "text-muted-foreground"
        }`}
        aria-label={`Filter by ${label.toLocaleLowerCase()}`}
      >
        <span>{label}</span>
        {values.length ? (
          <span className="flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] leading-4 text-primary-foreground">
            {values.length}
          </span>
        ) : null}
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner
          sideOffset={6}
          align="start"
          className="z-50 outline-none"
        >
          <Combobox.Popup className="w-60 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg outline-none">
            <Combobox.InputGroup className="flex h-10 items-center gap-2 border-b px-3">
              <Search
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <Combobox.Input
                placeholder={`Search ${label.toLocaleLowerCase()}`}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </Combobox.InputGroup>
            <Combobox.Empty>
              <span className="block px-3 py-6 text-center text-sm text-muted-foreground">
                No options found.
              </span>
            </Combobox.Empty>
            <Combobox.List className="max-h-64 overflow-y-auto p-1">
              {(item: FilterOption) => (
                <Combobox.Item
                  key={item.value || "all"}
                  value={item}
                  className="flex cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none select-none data-[highlighted]:bg-muted data-[selected]:font-medium"
                >
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <Combobox.ItemIndicator className="text-primary">
                    <Check className="size-4" aria-hidden="true" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

function SortSelect({
  value,
  onChange,
}: {
  value: "newest" | "oldest"
  onChange: (value: "newest" | "oldest") => void
}) {
  const SortIcon = value === "newest" ? ArrowDownWideNarrow : ArrowUpNarrowWide

  return (
    <label className="relative ml-auto inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors focus-within:ring-2 focus-within:ring-ring/40 hover:bg-muted hover:text-foreground">
      <SortIcon className="size-4" aria-hidden="true" />
      <span>{value === "newest" ? "Newest" : "Oldest"}</span>
      <ChevronDown className="size-3.5" aria-hidden="true" />
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value === "oldest" ? "oldest" : "newest")
        }
        aria-label="Sort by last updated"
        className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
      >
        <option value="newest">Last updated: newest</option>
        <option value="oldest">Last updated: oldest</option>
      </select>
    </label>
  )
}

function ResultTags({
  tags,
  onSelect,
}: {
  tags: string[]
  onSelect: (tag: string) => void
}) {
  if (!tags.length) return null

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag}>
          <button
            type="button"
            onClick={() => onSelect(tag)}
            className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {tag}
          </button>
        </li>
      ))}
    </ul>
  )
}

export function DocumentListPage({
  documents,
}: {
  documents: DocumentEntry[]
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("q") ?? ""
  const [effectiveQuery, setEffectiveQuery] = useState(query)
  const sortOrder = searchParams.get("sort") === "oldest" ? "oldest" : "newest"
  const searchIndex = useMemo(
    () => new DocumentSearchIndex(documents),
    [documents]
  )
  const documentOrder = useMemo(
    () => new Map(documents.map((document, index) => [document.slug, index])),
    [documents]
  )

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setEffectiveQuery(query),
      searchDelay
    )
    return () => window.clearTimeout(timeout)
  }, [query])

  const results = useMemo(() => {
    const matches = searchIndex.search(effectiveQuery)
    const direction = sortOrder === "newest" ? -1 : 1

    return matches.sort(
      (left, right) =>
        direction *
        ((documentOrder.get(left.slug) ?? 0) -
          (documentOrder.get(right.slug) ?? 0))
    )
  }, [documentOrder, effectiveQuery, searchIndex, sortOrder])
  const requestedPage = pageFromSearchParams(searchParams)
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize))
  const currentPage = Math.min(requestedPage, pageCount)
  const visibleDocuments = results.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const parsedQuery = parseSearchQuery(query)
  const importanceOptions = useMemo(
    () => uniqueMetadata(documents, "importance"),
    [documents]
  )
  const typeOptions = useMemo(
    () => uniqueMetadata(documents, "type"),
    [documents]
  )
  const tagOptions = useMemo(
    () =>
      [
        ...new Set(documents.flatMap(({ frontmatter }) => frontmatter.tags)),
      ].sort((left, right) => left.localeCompare(right)),
    [documents]
  )

  useEffect(() => {
    if (requestedPage === currentPage) return

    const nextParams = new URLSearchParams(searchParams)
    if (currentPage === 1) nextParams.delete("page")
    else nextParams.set("page", String(currentPage))
    setSearchParams(nextParams, { preventScrollReset: true, replace: true })
  }, [currentPage, requestedPage, searchParams, setSearchParams])

  function updateQuery(nextQuery: string) {
    const nextParams = new URLSearchParams(searchParams)
    if (nextQuery) nextParams.set("q", nextQuery)
    else nextParams.delete("q")
    nextParams.delete("page")
    setSearchParams(nextParams, { preventScrollReset: true, replace: true })
  }

  function updateQualifier(qualifier: SearchQualifier, values: string[]) {
    updateQuery(setSearchQualifiers(query, qualifier, values))
  }

  function updateSortOrder(value: "newest" | "oldest") {
    const nextParams = new URLSearchParams(searchParams)
    if (value === "newest") nextParams.delete("sort")
    else nextParams.set("sort", value)
    nextParams.delete("page")
    setSearchParams(nextParams, { preventScrollReset: true, replace: true })
  }

  function pageHref(page: number) {
    const nextParams = new URLSearchParams(searchParams)
    if (page === 1) nextParams.delete("page")
    else nextParams.set("page", String(page))
    const serializedParams = nextParams.toString()
    return serializedParams ? `?${serializedParams}` : "."
  }

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
          <span className="text-foreground">List</span>
        </nav>

        <section aria-labelledby="documents-heading">
          <div className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
            <DocsSearchInput
              value={query}
              onValueChange={updateQuery}
              onSubmit={() => setEffectiveQuery(query)}
            />

            <div className="mt-2 flex flex-wrap items-center gap-1">
              <FilterCombobox
                label="Importance"
                qualifier="importance"
                values={parsedQuery.qualifiers.importance}
                options={importanceOptions}
                onChange={updateQualifier}
              />
              <FilterCombobox
                label="Types"
                qualifier="type"
                values={parsedQuery.qualifiers.type}
                options={typeOptions}
                onChange={updateQualifier}
              />
              <FilterCombobox
                label="Tags"
                qualifier="tag"
                values={parsedQuery.qualifiers.tag}
                options={tagOptions}
                onChange={updateQualifier}
              />
              <SortSelect value={sortOrder} onChange={updateSortOrder} />
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between gap-4 border-b pb-4">
            <div>
              <p className="text-sm font-medium text-primary">Documentation</p>
              <h1
                id="documents-heading"
                className="mt-1 text-2xl font-semibold"
              >
                {query ? "Search results" : "All documents"}
              </h1>
            </div>
            <p
              className="text-sm text-muted-foreground"
              aria-live="polite"
              aria-atomic="true"
            >
              {results.length} {results.length === 1 ? "document" : "documents"}
            </p>
          </div>

          {visibleDocuments.length ? (
            <ul className="divide-y">
              {visibleDocuments.map((document) => (
                <li key={document.slug} className="py-6">
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <Link
                        to={`/docs/p/${document.slug}`}
                        className="group inline-flex items-center gap-2 text-lg font-semibold hover:text-primary"
                      >
                        {document.frontmatter.title}
                        <ArrowUpRight
                          className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </Link>
                      {document.frontmatter.description ? (
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                          {document.frontmatter.description}
                        </p>
                      ) : null}
                    </div>
                    {document.frontmatter.importance ? (
                      <span className="h-fit justify-self-start rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:justify-self-end">
                        {document.frontmatter.importance}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <ResultTags
                      tags={document.frontmatter.tags}
                      onSelect={(tag) =>
                        updateQualifier("tag", [
                          ...parsedQuery.qualifiers.tag,
                          tag,
                        ])
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-16 text-center">
              <h2 className="font-semibold">No documents found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try another term or remove one of the filters.
              </p>
              {query ? (
                <button
                  type="button"
                  onClick={() => updateQuery("")}
                  className="mt-5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Clear search
                </button>
              ) : null}
            </div>
          )}

          {results.length > pageSize ? (
            <nav
              className="mt-8 flex items-center justify-center gap-4 border-t pt-6"
              aria-label="Search result pages"
            >
              {currentPage > 1 ? (
                <Link
                  to={pageHref(currentPage - 1)}
                  preventScrollReset
                  className="rounded-lg border p-2 transition-colors hover:bg-muted"
                  aria-label="Previous page"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <span
                  className="rounded-lg border p-2 opacity-40"
                  aria-hidden="true"
                >
                  <ArrowLeft className="size-4" />
                </span>
              )}
              <span className="min-w-28 text-center text-sm text-muted-foreground">
                Page {currentPage} of {pageCount}
              </span>
              {currentPage < pageCount ? (
                <Link
                  to={pageHref(currentPage + 1)}
                  preventScrollReset
                  className="rounded-lg border p-2 transition-colors hover:bg-muted"
                  aria-label="Next page"
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <span
                  className="rounded-lg border p-2 opacity-40"
                  aria-hidden="true"
                >
                  <ArrowRight className="size-4" />
                </span>
              )}
            </nav>
          ) : null}
        </section>
      </main>
    </DocsShell>
  )
}
