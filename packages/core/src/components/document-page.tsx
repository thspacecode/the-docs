import { useCallback, useEffect } from "react"
import { ArrowLeft, BookOpen, Search } from "lucide-react"
import { Link, NavLink, useLocation, useNavigate } from "react-router"

import type { DocumentEntry } from "../content/types"
import { docsSearchInputId } from "./docs-search-input"

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

export function DocsShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()

  const focusSearch = useCallback(() => {
    const input = document.getElementById(docsSearchInputId)

    if (input instanceof HTMLInputElement) {
      input.focus()
      input.select()
      return
    }

    navigate("/list")
    window.setTimeout(() => {
      const listInput = document.getElementById(docsSearchInputId)
      if (listInput instanceof HTMLInputElement) listInput.focus()
    })
  }, [navigate])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const commandKey = (event.metaKey || event.ctrlKey) && event.key === "k"
      const slashKey = event.key === "/" && !isEditableTarget(event.target)

      if (!commandKey && !slashKey) return

      event.preventDefault()
      focusSearch()
    }

    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [focusSearch])

  const navigationClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-6">
          <Link
            to="/"
            className="mr-1 flex shrink-0 items-center gap-2 font-semibold"
            aria-label="The Docs home"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-4" aria-hidden="true" />
            </span>
            <span className="hidden sm:inline">The Docs</span>
          </Link>

          <nav className="flex items-center" aria-label="Documentation">
            <NavLink to="/list" className={navigationClass}>
              List
            </NavLink>
            <NavLink
              to="/tags/tree"
              className={() =>
                navigationClass({
                  isActive: location.pathname.startsWith("/tags/"),
                })
              }
            >
              Tags
            </NavLink>
            <NavLink to="/scopes" className={navigationClass}>
              Scopes
            </NavLink>
          </nav>

          <button
            type="button"
            onClick={focusSearch}
            className="ml-auto flex h-9 min-w-9 items-center gap-2 rounded-lg border px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:min-w-48"
            aria-label="Search documentation"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[0.65rem] md:inline">
              ⌘ K
            </kbd>
          </button>
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

export function DocumentPage({ document }: { document: DocumentEntry }) {
  const { Component, frontmatter } = document

  return (
    <DocsShell>
      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Link
          to="/list"
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
