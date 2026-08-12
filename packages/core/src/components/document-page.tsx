import { useCallback, useEffect, useState } from "react"
import { Popover } from "@base-ui/react/popover"
import {
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
import { Link, NavLink, useLocation } from "react-router"

import { getDocuments, getScopes, getTags } from "../content/registry"
import type {
  DocumentEntry,
  RelatedDocumentsSection,
  ScopeDefinition,
  ScopeDocumentReference,
} from "../content/types"
import { DocsPageLayout } from "./docs-page-layout"
import { GlobalSearch } from "./global-search"
import { Importance } from "./importance"
import { RelatedDocuments } from "./related-documents"
import { RelativeModifiedTime } from "./relative-modified-time"
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

export function DocsShell({
  children,
  searchOpen: controlledSearchOpen,
  onSearchOpenChange,
}: {
  children: React.ReactNode
  searchOpen?: boolean
  onSearchOpenChange?: (open: boolean) => void
}) {
  const location = useLocation()
  const [internalSearchOpen, setInternalSearchOpen] = useState(false)
  const searchOpen = controlledSearchOpen ?? internalSearchOpen
  const setSearchOpen = useCallback(
    (open: boolean) => {
      if (controlledSearchOpen === undefined) setInternalSearchOpen(open)
      onSearchOpenChange?.(open)
    },
    [controlledSearchOpen, onSearchOpenChange]
  )

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const commandKey =
        (event.metaKey || event.ctrlKey) &&
        event.key.toLocaleLowerCase() === "k"
      const slashKey = event.key === "/" && !isEditableTarget(event.target)

      if (!commandKey && !slashKey) return

      event.preventDefault()
      setSearchOpen(true)
    }

    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [setSearchOpen])

  const navigationClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-primary-2 text-primary-11 hover:bg-primary-3 active:bg-primary-4"
        : "text-muted-foreground hover:bg-primary-3 hover:text-primary-11 active:bg-primary-4"
    }`
  const hasScopeContext =
    location.pathname.startsWith("/scopes") ||
    (location.pathname.startsWith("/p/") &&
      new URLSearchParams(location.search).has("scope"))

  return (
    <div className="min-h-svh bg-grey-2">
      <div className="mx-auto flex min-h-svh max-w-screen-xl flex-col border-x bg-background 2xl:max-w-screen-2xl">
        <header className="sticky top-0 z-20 border-b bg-grey-1 backdrop-blur-xl">
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

            <nav className="flex items-center gap-2" aria-label="Documentation">
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
              onClick={() => setSearchOpen(true)}
              className="ml-auto flex h-9 min-w-9 items-center gap-2 rounded-lg border px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:min-w-48"
              aria-label="Search documentation"
            >
              <Search className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[0.65rem] md:inline">
                Ctrl K
              </kbd>
            </button>
          </div>
        </header>
        {children}
        <footer className="mt-auto border-t">
          <div className="flex min-h-16 items-center bg-grey-1 px-6 sm:px-11">
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
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        documents={getDocuments()}
        scopes={getScopes()}
        tags={getTags()}
      />
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
    return (
      <div
        className="docs-layout-left hidden border-r lg:block"
        aria-hidden="true"
      />
    )
  }

  const documentsBySlug = new Map(
    documents.map((document) => [document.slug, document])
  )
  const currentDocument = documentsBySlug.get(currentDocumentSlug)

  return (
    <aside
      className="docs-layout-left hidden border-r lg:block"
      aria-label={`${scope.title} scope`}
    >
      <div className="sticky top-16 max-h-[calc(100svh-4rem)] overflow-y-auto py-4 pr-4 pl-11">
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
      className="grid gap-3 border-t py-8 sm:grid-cols-2"
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
  const [now] = useState(() => Date.now())
  const hasTableOfContents = tableOfContents.length > 0

  return (
    <DocsShell>
      <DocsPageLayout variant="rails" className="min-h-full">
        <ScopeDocumentNavigation
          scope={scope}
          scopes={scopes}
          currentDocumentSlug={document.slug}
          documents={documents}
        />

        <article className="docs-layout-main min-w-0">
          <header className="docs-centered-layout border-b py-10 sm:py-12">
            <div>
              <nav
                className="mb-8 text-sm text-muted-foreground"
                aria-label="Breadcrumb"
              >
                <Link
                  to="/"
                  className="transition-colors hover:text-foreground"
                >
                  Docs
                </Link>{" "}
                <span aria-hidden="true">/</span>{" "}
                <span className="text-foreground">{frontmatter.title}</span>
              </nav>

              <div className="flex items-start gap-4">
                <h1 className="min-w-0 flex-1 text-4xl font-semibold tracking-tight text-balance text-primary sm:text-5xl">
                  {frontmatter.title}
                </h1>
                {frontmatter.importance ? (
                  <Importance
                    value={frontmatter.importance}
                    className="mt-2 shrink-0 sm:mt-3"
                  />
                ) : null}
              </div>
              {frontmatter.description ? (
                <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                  {frontmatter.description}
                </p>
              ) : null}
              <div className="mt-6 flex items-end gap-4">
                <Tags tags={frontmatter.tags} />
                <RelativeModifiedTime
                  modifiedAt={document.modifiedAt}
                  now={now}
                />
              </div>
            </div>
          </header>

          {hasTableOfContents ? (
            <MobileTableOfContents items={tableOfContents} />
          ) : null}

          <section className="docs-centered-layout py-10 sm:py-12">
            <div className="docs-content [&>*:first-child]:mt-0">
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

          <div className="docs-centered-layout">
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
          <div
            className="docs-layout-right hidden border-l 2xl:block"
            aria-hidden="true"
          />
        )}
      </DocsPageLayout>
    </DocsShell>
  )
}
