import { ArrowLeft, BookOpen } from "lucide-react"
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
            {frontmatter.tags.length ? (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
                {frontmatter.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </header>

          <div className="typeset typeset-docs max-w-[37em]">
            <Component />
          </div>
        </article>
      </main>
    </DocsShell>
  )
}
