import { useCallback, useEffect, useState } from "react"
import { Popover } from "@base-ui/react/popover"
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  FolderTree,
  Layers3,
  Search,
} from "lucide-react"
import { Link, NavLink, useLocation, useNavigate } from "react-router"

import type {
  DocumentEntry,
  RelatedDocumentsSection,
  ScopeDefinition,
  ScopeDocumentReference,
} from "../content/types"
import { docsSearchInputId } from "./docs-search-input"
import { RelatedDocuments } from "./related-documents"
import { ScopeIcon } from "./scope-icon"
import {
  DesktopTableOfContents,
  MobileTableOfContents,
} from "./table-of-contents"

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
  const hasScopeContext =
    location.pathname.startsWith("/scopes") ||
    (location.pathname.startsWith("/p/") &&
      new URLSearchParams(location.search).has("scope"))

  return (
    <div className="min-h-svh bg-muted px-2">
      <div className="mx-auto flex min-h-svh max-w-[1456px] flex-col border-x bg-background">
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full items-center gap-3 px-6 sm:px-11">
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
              <NavLink
                to="/scopes"
                className={() => navigationClass({ isActive: hasScopeContext })}
              >
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
        <footer className="mt-auto border-t">
          <div className="flex min-h-16 items-center px-6 sm:px-11">
            <a
              href="https://github.com/thspacecode/the-docs"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </footer>
      </div>
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

function scopedDocumentHref(documentSlug: string, scopeSlug: string) {
  return `/p/${documentSlug}?${new URLSearchParams({ scope: scopeSlug }).toString()}`
}

function scopeReferences(scope: ScopeDefinition) {
  return scope.sections.flatMap((section) => [
    ...section.documents,
    ...section.groups.flatMap((group) => [
      ...(group.document ? [group.document] : []),
      ...group.documents,
    ]),
  ])
}

function ScopeReferenceLink({
  reference,
  scope,
  currentDocumentSlug,
  documentsBySlug,
  label,
  nested = false,
}: {
  reference: ScopeDocumentReference
  scope: ScopeDefinition
  currentDocumentSlug: string
  documentsBySlug: Map<string, DocumentEntry>
  label?: string
  nested?: boolean
}) {
  const document = documentsBySlug.get(reference.slug)
  if (!document) return null

  const isCurrent = document.slug === currentDocumentSlug

  return (
    <Link
      to={scopedDocumentHref(document.slug, scope.slug)}
      aria-current={isCurrent ? "page" : undefined}
      className={`flex items-center gap-2 rounded-md py-1.5 pr-2 text-sm transition-colors ${
        nested ? "pl-7" : "pl-2"
      } ${
        isCurrent
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <ScopeIcon
        name={reference.icon}
        fallback={FileText}
        className="size-3.5 shrink-0"
      />
      <span className="truncate">{label ?? document.frontmatter.title}</span>
    </Link>
  )
}

function ScopeSelector({
  scope,
  scopes,
  currentDocument,
}: {
  scope: ScopeDefinition
  scopes: ScopeDefinition[]
  currentDocument?: DocumentEntry
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-left font-semibold shadow-xs transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 data-popup-open:bg-muted">
        <ScopeIcon
          name={scope.icon}
          fallback={Layers3}
          className="size-4 shrink-0 text-primary"
        />
        <span className="min-w-0 flex-1 truncate">{scope.title}</span>
        <ChevronsUpDown
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start" className="z-50">
          <Popover.Popup className="w-72 max-w-[var(--available-width)] origin-[var(--transform-origin)] rounded-xl border bg-popover p-1 text-popover-foreground shadow-xl transition-[transform,opacity] duration-100 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <ul aria-label="Select scope">
              {scopes.map((candidate) => {
                const isSelected = candidate.slug === scope.slug
                const containsCurrentDocument = Boolean(
                  currentDocument?.scopeSlugs.includes(candidate.slug)
                )
                const href =
                  currentDocument && containsCurrentDocument
                    ? scopedDocumentHref(currentDocument.slug, candidate.slug)
                    : `/scopes/${candidate.slug}`

                return (
                  <li key={candidate.slug}>
                    <Link
                      to={href}
                      onClick={() => setOpen(false)}
                      aria-current={isSelected ? "true" : undefined}
                      className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-primary">
                        <ScopeIcon
                          name={candidate.icon}
                          fallback={Layers3}
                          className="size-4"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block leading-5 font-semibold">
                          {candidate.title}
                        </span>
                        {candidate.description ? (
                          <span className="mt-0.5 line-clamp-2 block text-sm leading-5 text-muted-foreground">
                            {candidate.description}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <Check
                          className="mt-1 size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function ScopeDocumentNavigation({
  scope,
  scopes,
  currentDocumentSlug,
  documents,
}: {
  scope?: ScopeDefinition
  scopes: ScopeDefinition[]
  currentDocumentSlug: string
  documents: DocumentEntry[]
}) {
  if (!scope) {
    return <div className="hidden border-r xl:block" aria-hidden="true" />
  }

  const documentsBySlug = new Map(
    documents.map((document) => [document.slug, document])
  )
  const currentDocument = documentsBySlug.get(currentDocumentSlug)

  return (
    <aside
      className="hidden border-r xl:block"
      aria-label={`${scope.title} scope`}
    >
      <div className="sticky top-16 max-h-[calc(100svh-4rem)] overflow-y-auto p-4">
        <ScopeSelector
          scope={scope}
          scopes={scopes}
          currentDocument={currentDocument}
        />

        <div className="mt-4 space-y-5">
          {scope.sections.map((section) => (
            <section key={section.id} aria-labelledby={`nav-${section.id}`}>
              <h2
                id={`nav-${section.id}`}
                className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {section.title}
              </h2>
              <div className="mt-1 space-y-0.5">
                {section.documents.map((reference) => (
                  <ScopeReferenceLink
                    key={reference.slug}
                    reference={reference}
                    scope={scope}
                    currentDocumentSlug={currentDocumentSlug}
                    documentsBySlug={documentsBySlug}
                  />
                ))}
                {section.groups.map((group) => {
                  const groupDocument = group.document
                    ? documentsBySlug.get(group.document.slug)
                    : undefined
                  const title =
                    group.title ?? groupDocument?.frontmatter.title ?? group.id

                  return (
                    <div key={group.id} className="pt-1">
                      {group.document ? (
                        <ScopeReferenceLink
                          reference={{
                            ...group.document,
                            icon: group.icon ?? group.document.icon,
                          }}
                          scope={scope}
                          currentDocumentSlug={currentDocumentSlug}
                          documentsBySlug={documentsBySlug}
                          label={title}
                        />
                      ) : (
                        <p className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium">
                          <ScopeIcon
                            name={group.icon}
                            fallback={FolderTree}
                            className="size-3.5 shrink-0"
                          />
                          <span className="truncate">{title}</span>
                        </p>
                      )}
                      {group.documents.map((reference) => (
                        <ScopeReferenceLink
                          key={reference.slug}
                          reference={reference}
                          scope={scope}
                          currentDocumentSlug={currentDocumentSlug}
                          documentsBySlug={documentsBySlug}
                          nested
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </aside>
  )
}

function ScopePreviousNext({
  scope,
  document,
  documents,
}: {
  scope?: ScopeDefinition
  document: DocumentEntry
  documents: DocumentEntry[]
}) {
  if (!scope) return null

  const references = scopeReferences(scope)
  const currentIndex = references.findIndex(
    (reference) => reference.slug === document.slug
  )
  if (currentIndex < 0) return null

  const documentsBySlug = new Map(documents.map((entry) => [entry.slug, entry]))
  const previousReference = references[currentIndex - 1]
  const nextReference = references[currentIndex + 1]
  const previousDocument = previousReference
    ? documentsBySlug.get(previousReference.slug)
    : undefined
  const nextDocument = nextReference
    ? documentsBySlug.get(nextReference.slug)
    : undefined

  if (!previousDocument && !nextDocument) return null

  return (
    <nav
      className="mx-auto grid max-w-3xl gap-3 border-t px-6 py-8 sm:grid-cols-2 sm:px-0"
      aria-label="Scope document navigation"
    >
      {previousDocument ? (
        <Link
          to={scopedDocumentHref(previousDocument.slug, scope.slug)}
          className="group rounded-xl border p-4 transition-colors hover:border-primary/40"
        >
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Previous
          </span>
          <span className="mt-1 block font-semibold transition-colors group-hover:text-primary">
            {previousDocument.frontmatter.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {nextDocument ? (
        <Link
          to={scopedDocumentHref(nextDocument.slug, scope.slug)}
          className="group rounded-xl border p-4 text-right transition-colors hover:border-primary/40"
        >
          <span className="flex items-center justify-end gap-1 text-xs font-medium text-muted-foreground">
            Next
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </span>
          <span className="mt-1 block font-semibold transition-colors group-hover:text-primary">
            {nextDocument.frontmatter.title}
          </span>
        </Link>
      ) : null}
    </nav>
  )
}

export function DocumentPage({
  document,
  scope,
  scopes = [],
  documents = [],
  relatedDocumentSections = [],
}: {
  document: DocumentEntry
  scope?: ScopeDefinition
  scopes?: ScopeDefinition[]
  documents?: DocumentEntry[]
  relatedDocumentSections?: RelatedDocumentsSection[]
}) {
  const { Component, frontmatter, tableOfContents = [] } = document
  const hasTableOfContents = tableOfContents.length > 0

  return (
    <DocsShell>
      <main className="w-full flex-1">
        <div className="grid min-h-full xl:grid-cols-[232px_minmax(0,1fr)_232px]">
          <ScopeDocumentNavigation
            scope={scope}
            scopes={scopes}
            currentDocumentSlug={document.slug}
            documents={documents}
          />

          <article className="min-w-0">
            <header className="border-b px-6 py-10 sm:px-11 sm:py-12">
              <div className="mx-auto max-w-3xl">
                <Link
                  to={scope ? `/scopes/${scope.slug}` : "/list"}
                  className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  {scope ? scope.title : "All documentation"}
                </Link>

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
              </div>
            </header>

            {hasTableOfContents ? (
              <MobileTableOfContents items={tableOfContents} />
            ) : null}

            <section className="px-6 py-10 sm:px-11 sm:py-12">
              <div className="docs-content mx-auto max-w-3xl [&>*:first-child]:mt-0">
                <Component />
              </div>
            </section>

            {relatedDocumentSections.length ? (
              <div className="pb-10 sm:pb-12">
                <RelatedDocuments
                  documentSlug={document.slug}
                  sections={relatedDocumentSections}
                />
              </div>
            ) : null}

            <div className="px-6 sm:px-11">
              <ScopePreviousNext
                scope={scope}
                document={document}
                documents={documents}
              />
            </div>
          </article>

          {hasTableOfContents ? (
            <DesktopTableOfContents items={tableOfContents} />
          ) : (
            <div className="hidden border-l xl:block" aria-hidden="true" />
          )}
        </div>
      </main>
    </DocsShell>
  )
}
