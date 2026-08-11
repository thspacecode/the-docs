import { useState } from "react"
import { ArrowRight, ArrowUpRight, Layers3, Tag } from "lucide-react"
import { Link, useNavigate } from "react-router"

import type { DocumentEntry, TagDefinition } from "../content/types"
import { DocsSearchInput } from "./docs-search-input"
import { DocsShell } from "./document-page"

const latestDocumentCount = 3
const featuredTagCount = 8

function qualifierHref(qualifier: "scope" | "tag", value: string) {
  const serializedValue = /\s/.test(value) ? `"${value}"` : value
  const params = new URLSearchParams({ q: `${qualifier}:${serializedValue}` })
  return `/list?${params.toString()}`
}

function countDocumentsForTag(tag: TagDefinition, documents: DocumentEntry[]) {
  return documents.filter((document) =>
    document.frontmatter.tags.some(
      (documentTag) =>
        documentTag === tag.slug || documentTag.startsWith(`${tag.slug}/`)
    )
  ).length
}

export function HomePage({
  documents,
  tags,
  title = "The Docs",
  description = "Find architecture notes, product decisions, and practical guides.",
}: {
  documents: DocumentEntry[]
  tags: TagDefinition[]
  title?: string
  description?: string
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const scopes = [
    ...new Set(
      documents
        .map((document) => document.frontmatter.scope)
        .filter((scope): scope is string => Boolean(scope))
    ),
  ].sort((left, right) => left.localeCompare(right))
  const latestDocuments = documents.slice(-latestDocumentCount).reverse()
  const featuredTags = tags
    .map((tag) => ({
      ...tag,
      documentCount: countDocumentsForTag(tag, documents),
    }))
    .sort(
      (left, right) =>
        right.documentCount - left.documentCount ||
        left.title.localeCompare(right.title)
    )
    .slice(0, featuredTagCount)

  function submitSearch() {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      navigate("/list")
      return
    }

    navigate(`/list?${new URLSearchParams({ q: trimmedQuery }).toString()}`)
  }

  return (
    <DocsShell>
      <main className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
        <section aria-labelledby="home-heading">
          <p className="text-sm font-medium text-primary">Documentation</p>
          <h1
            id="home-heading"
            className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
          >
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            {description}
          </p>
          <div className="mt-8 max-w-3xl">
            <DocsSearchInput
              value={query}
              onValueChange={setQuery}
              onSubmit={submitSearch}
              placeholder="Search guides, topics, and tags"
            />
          </div>
        </section>

        {scopes.length ? (
          <section className="mt-16" aria-labelledby="scopes-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">Browse by</p>
                <h2
                  id="scopes-heading"
                  className="mt-1 text-2xl font-semibold tracking-tight"
                >
                  Scope
                </h2>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {scopes.map((scope) => {
                const scopeDocuments = documents.filter(
                  (document) => document.frontmatter.scope === scope
                )

                return (
                  <Link
                    key={scope}
                    to={qualifierHref("scope", scope)}
                    className="group rounded-xl border bg-card p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="flex items-start justify-between gap-4">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Layers3 className="size-4" aria-hidden="true" />
                      </span>
                      <ArrowUpRight
                        className="size-4 text-muted-foreground transition group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-5 block text-lg font-semibold group-hover:text-primary">
                      {scope}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                      {scopeDocuments.length}{" "}
                      {scopeDocuments.length === 1 ? "document" : "documents"}
                      {scopeDocuments[0]?.frontmatter.description
                        ? ` · ${scopeDocuments[0].frontmatter.description}`
                        : ""}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-16" aria-labelledby="latest-heading">
          <div className="flex items-end justify-between gap-4 border-b pb-4">
            <div>
              <p className="text-sm font-medium text-primary">What’s new</p>
              <h2
                id="latest-heading"
                className="mt-1 text-2xl font-semibold tracking-tight"
              >
                Latest
              </h2>
            </div>
            <Link
              to="/list"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              View all
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>

          {latestDocuments.length ? (
            <ul className="divide-y">
              {latestDocuments.map((document) => (
                <li key={document.slug}>
                  <Link
                    to={`/docs/p/${document.slug}`}
                    className="group grid gap-4 py-6 sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <span className="min-w-0">
                      <span className="text-lg font-semibold transition-colors group-hover:text-primary">
                        {document.frontmatter.title}
                      </span>
                      {document.frontmatter.description ? (
                        <span className="mt-1 block max-w-3xl text-sm leading-6 text-muted-foreground">
                          {document.frontmatter.description}
                        </span>
                      ) : null}
                      {document.frontmatter.tags.length ? (
                        <span className="mt-3 flex flex-wrap gap-2">
                          {document.frontmatter.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </span>
                    <ArrowUpRight
                      className="mt-1 hidden size-4 text-muted-foreground transition group-hover:text-primary sm:block"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-sm text-muted-foreground">
              No documentation has been published yet.
            </p>
          )}
        </section>

        {featuredTags.length ? (
          <section className="mt-16" aria-labelledby="tags-heading">
            <div className="flex items-end justify-between gap-4 border-b pb-4">
              <div>
                <p className="text-sm font-medium text-primary">Explore</p>
                <h2
                  id="tags-heading"
                  className="mt-1 text-2xl font-semibold tracking-tight"
                >
                  Tags
                </h2>
              </div>
              <Link
                to="/tags/tree"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                View all tags
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>

            <ul className="mt-2 grid gap-x-8 md:grid-cols-2">
              {featuredTags.map((tag) => (
                <li key={tag.slug} className="border-b">
                  <Link
                    to={qualifierHref("tag", tag.slug)}
                    className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 py-5"
                  >
                    <span
                      className="mt-0.5 flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground transition group-hover:border-primary/40 group-hover:text-primary"
                      style={
                        tag.color
                          ? { borderColor: tag.color, color: tag.color }
                          : undefined
                      }
                    >
                      <Tag className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="font-semibold transition-colors group-hover:text-primary">
                        {tag.title}
                      </span>
                      {tag.description ? (
                        <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">
                          {tag.description}
                        </span>
                      ) : null}
                    </span>
                    <span className="pt-1 text-sm text-muted-foreground tabular-nums">
                      {tag.documentCount}
                      <span className="sr-only">
                        {tag.documentCount === 1 ? " document" : " documents"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </DocsShell>
  )
}
