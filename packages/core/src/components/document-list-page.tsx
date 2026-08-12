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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import type {
  DocumentEntry,
  TagDefinition,
  TypeDefinition,
} from "../content/types"
import {
  DocumentSearchIndex,
  parseSearchQuery,
  setSearchQualifiers,
  type SearchQualifier,
} from "../search/document-search"
import { DocsPageLayout } from "./docs-page-layout"
import { DocsSearchInput } from "./docs-search-input"
import { DocumentListFacet } from "./document-list-facet"
import { DocsShell } from "./document-page"
import { Importance } from "./importance"
import { RelativeModifiedTime } from "./relative-modified-time"

const pageSize = 6
const searchDelay = 150

const importancePriorities: Record<string, number> = {
  highest: 5,
  high: 4,
  medium: 3,
  low: 2,
  lowest: 1,
}

type SortBy = "updated" | "importance"
type SortOrder = "ascending" | "descending"

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
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 data-[popup-open]:bg-muted ${
          values.length ? "text-primary" : "text-muted-foreground"
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
                  className="flex cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-muted data-[selected]:font-medium"
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

function SortMenu({
  sortBy,
  order,
  onSortByChange,
  onOrderChange,
}: {
  sortBy: SortBy
  order: SortOrder
  onSortByChange: (value: SortBy) => void
  onOrderChange: (value: SortOrder) => void
}) {
  const SortIcon =
    order === "descending" ? ArrowDownWideNarrow : ArrowUpNarrowWide
  const sortLabel = sortBy === "updated" ? "Last updated" : "Importance"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 data-[popup-open]:bg-muted"
        aria-label={`Sort by ${sortLabel}, ${order}`}
      >
        <SortIcon className="size-4" aria-hidden="true" />
        <span>{sortLabel}</span>
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuRadioGroup
          value={sortBy}
          onValueChange={(nextValue) =>
            onSortByChange(
              nextValue === "importance" ? "importance" : "updated"
            )
          }
        >
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioItem value="updated" className="py-1.5 pr-8 pl-2.5">
            Last updated
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="importance"
            className="py-1.5 pr-8 pl-2.5"
          >
            Importance
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={order}
          onValueChange={(nextValue) =>
            onOrderChange(
              nextValue === "ascending" ? "ascending" : "descending"
            )
          }
        >
          <DropdownMenuLabel>Order</DropdownMenuLabel>
          <DropdownMenuRadioItem
            value="ascending"
            className="py-1.5 pr-8 pl-2.5"
          >
            <ArrowUpNarrowWide aria-hidden="true" />
            Ascending
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="descending"
            className="py-1.5 pr-8 pl-2.5"
          >
            <ArrowDownWideNarrow aria-hidden="true" />
            Descending
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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
  tags = [],
  types = [],
}: {
  documents: DocumentEntry[]
  tags?: TagDefinition[]
  types?: TypeDefinition[]
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("q") ?? ""
  const [effectiveQuery, setEffectiveQuery] = useState(query)
  const [now] = useState(() => Date.now())
  const sortBy: SortBy =
    searchParams.get("sort") === "importance" ? "importance" : "updated"
  const sortOrder: SortOrder =
    searchParams.get("order") === "asc" || searchParams.get("sort") === "oldest"
      ? "ascending"
      : "descending"
  const searchIndex = useMemo(
    () => new DocumentSearchIndex(documents),
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
    const direction = sortOrder === "ascending" ? 1 : -1

    function sortValue(document: DocumentEntry) {
      if (sortBy === "updated") return document.modifiedAt

      const importance = document.frontmatter.importance
      return importance
        ? (importancePriorities[importance.toLocaleLowerCase()] ?? 0)
        : 0
    }

    return matches.sort(
      (left, right) =>
        direction * (sortValue(left) - sortValue(right)) ||
        left.frontmatter.title.localeCompare(right.frontmatter.title)
    )
  }, [effectiveQuery, searchIndex, sortBy, sortOrder])
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
  const scopeOptions = useMemo(
    () =>
      [...new Set(documents.flatMap(({ scopeSlugs }) => scopeSlugs))].sort(
        (left, right) => left.localeCompare(right)
      ),
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

  function updateSorting(nextSortBy: SortBy, nextOrder: SortOrder) {
    const nextParams = new URLSearchParams(searchParams)
    if (nextSortBy === "updated") nextParams.delete("sort")
    else nextParams.set("sort", nextSortBy)
    if (nextOrder === "descending") nextParams.delete("order")
    else nextParams.set("order", "asc")
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
      <DocsPageLayout variant="rails" className="min-h-full">
        <DocumentListFacet
          tags={tags}
          types={types}
          documentTags={tagOptions}
          documentTypes={typeOptions}
          qualifiers={parsedQuery.qualifiers}
          onChange={updateQualifier}
        />

        <article className="docs-layout-main min-w-0">
          <header className="docs-centered-layout py-10 sm:py-12">
            <nav
              className="w-full text-sm text-muted-foreground"
              aria-label="Breadcrumb"
            >
              <Link to="/" className="transition-colors hover:text-foreground">
                Docs
              </Link>{" "}
              <span aria-hidden="true">/</span>{" "}
              <span className="text-foreground">List</span>
            </nav>
          </header>

          <section aria-label="Documents">
            <div className="docs-centered-layout border-y bg-grey-3">
              <div className="w-full pt-8 pb-6">
                <DocsSearchInput
                  value={query}
                  onValueChange={updateQuery}
                  onSubmit={() => setEffectiveQuery(query)}
                  showShortcut={false}
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
                    label="Scopes"
                    qualifier="scope"
                    values={parsedQuery.qualifiers.scope}
                    options={scopeOptions}
                    onChange={updateQualifier}
                  />
                  <FilterCombobox
                    label="Tags"
                    qualifier="tag"
                    values={parsedQuery.qualifiers.tag}
                    options={tagOptions}
                    onChange={updateQualifier}
                  />
                  <SortMenu
                    sortBy={sortBy}
                    order={sortOrder}
                    onSortByChange={(value) => updateSorting(value, sortOrder)}
                    onOrderChange={(value) => updateSorting(sortBy, value)}
                  />
                </div>
              </div>
            </div>

            <div className="docs-centered-layout">
              <div className="w-full">
                {visibleDocuments.length ? (
                  <ul className="mt-6">
                    {visibleDocuments.map((document) => (
                      <li key={document.slug} className="py-6">
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <div className="min-w-0">
                            <Link
                              to={`/p/${document.slug}`}
                              className="group inline-flex items-center gap-2 text-lg font-medium text-secondary-11 transition-colors hover:text-secondary-12"
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
                            <Importance
                              value={document.frontmatter.importance}
                              className="h-fit justify-self-start sm:justify-self-end"
                            />
                          ) : null}
                        </div>
                        <div className="mt-4 flex items-end gap-4">
                          <ResultTags
                            tags={document.frontmatter.tags}
                            onSelect={(tag) =>
                              updateQualifier("tag", [
                                ...parsedQuery.qualifiers.tag,
                                tag,
                              ])
                            }
                          />
                          <RelativeModifiedTime
                            modifiedAt={document.modifiedAt}
                            now={now}
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
                    className="mt-8 flex items-center justify-end gap-4 pt-6"
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
              </div>
            </div>
          </section>
        </article>

        <div
          className="docs-layout-right hidden border-l 2xl:block"
          aria-hidden="true"
        />
      </DocsPageLayout>
    </DocsShell>
  )
}
