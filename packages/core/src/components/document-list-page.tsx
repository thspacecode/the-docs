import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react"
import { Link, useSearchParams } from "react-router"

import type { DocumentEntry } from "../content/types"
import {
  DocumentSearchIndex,
  parseSearchQuery,
  setSearchQualifier,
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

function FilterSelect({
  label,
  qualifier,
  value,
  options,
  onChange,
}: {
  label: string
  qualifier: SearchQualifier
  value: string
  options: string[]
  onChange: (qualifier: SearchQualifier, value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(qualifier, event.target.value)}
        className="h-9 min-w-32 rounded-lg border bg-background px-3 text-sm font-normal text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option.toLocaleLowerCase()}>
            {option}
          </option>
        ))}
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

  const results = useMemo(
    () => searchIndex.search(effectiveQuery),
    [effectiveQuery, searchIndex]
  )
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

  function updateQualifier(qualifier: SearchQualifier, value: string) {
    updateQuery(setSearchQualifier(query, qualifier, value))
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
      <main className="mx-auto max-w-5xl px-6 py-8 sm:py-12">
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

            <div className="mt-4 flex flex-wrap items-end gap-3 border-t pt-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium sm:mb-0">
                <SlidersHorizontal
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                Filters
              </div>
              <FilterSelect
                label="Importance"
                qualifier="importance"
                value={parsedQuery.qualifiers.importance[0] ?? ""}
                options={importanceOptions}
                onChange={updateQualifier}
              />
              <FilterSelect
                label="Types"
                qualifier="type"
                value={parsedQuery.qualifiers.type[0] ?? ""}
                options={typeOptions}
                onChange={updateQualifier}
              />
              <FilterSelect
                label="Tags"
                qualifier="tag"
                value={parsedQuery.qualifiers.tag[0] ?? ""}
                options={tagOptions}
                onChange={updateQualifier}
              />
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
                      onSelect={(tag) => updateQualifier("tag", tag)}
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
