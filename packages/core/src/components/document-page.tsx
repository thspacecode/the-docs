import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react"
import { Link } from "react-router"

import type { DocumentEntry } from "../content/types"

export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-4" aria-hidden="true" />
            </span>
            The Docs
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}

function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Tags">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground"
        >
          {tag}
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
  return (
    <DocsShell>
      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Documentation</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            The Docs
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Architecture notes and guides, read directly from version-controlled
            MDX files.
          </p>
        </header>

        <section className="mt-12" aria-labelledby="documents-heading">
          <div className="flex items-end justify-between gap-4 border-b pb-4">
            <h2 id="documents-heading" className="text-lg font-semibold">
              All documents
            </h2>
            <p className="text-sm text-muted-foreground">
              {documents.length}{" "}
              {documents.length === 1 ? "document" : "documents"}
            </p>
          </div>

          {documents.length ? (
            <ul className="divide-y">
              {documents.map((document) => (
                <li key={document.slug}>
                  <Link
                    to={`/docs/p/${document.slug}`}
                    className="group grid gap-4 py-6 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-2 text-lg font-semibold group-hover:text-primary">
                        {document.frontmatter.title}
                        <ArrowUpRight
                          className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </span>
                      {document.frontmatter.description ? (
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                          {document.frontmatter.description}
                        </p>
                      ) : null}
                    </div>
                    <Tags tags={document.frontmatter.tags} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-12 text-sm text-muted-foreground">
              No documents found. Add an index.mdx file under docs/&lt;slug&gt;.
            </p>
          )}
        </section>
      </main>
    </DocsShell>
  )
}

export function DocumentPage({ document }: { document: DocumentEntry }) {
  const { Component, frontmatter } = document

  return (
    <DocsShell>
      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All documentation
        </Link>

        <article>
          <header className="mb-10 border-b pb-8">
            <p className="mb-3 text-sm font-medium text-primary">
              Documentation
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {frontmatter.title}
            </h1>
            {frontmatter.description ? (
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                {frontmatter.description}
              </p>
            ) : null}
            <div className="mt-6">
              <Tags tags={frontmatter.tags} />
            </div>
          </header>

          <div className="docs-content">
            <Component />
          </div>
        </article>
      </main>
    </DocsShell>
  )
}
