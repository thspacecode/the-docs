import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  FolderTree,
  Layers3,
} from "lucide-react"
import { Link } from "react-router"

import { scopeDocumentSlugs } from "../content/registry"
import type {
  DocumentEntry,
  ScopeDefinition,
  ScopeDocumentReference,
  ScopeGroupDefinition,
} from "../content/types"
import { DocsShell } from "./document-page"
import { ScopeIcon } from "./scope-icon"

function documentHref(documentSlug: string, scopeSlug: string) {
  return `/p/${documentSlug}?${new URLSearchParams({ scope: scopeSlug }).toString()}`
}

function documentCountLabel(count: number) {
  return `${count} ${count === 1 ? "document" : "documents"}`
}

export function ScopesPage({ scopes }: { scopes: ScopeDefinition[] }) {
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
          <span className="text-foreground">Scopes</span>
        </nav>

        <section aria-labelledby="scopes-heading">
          <div className="border-b pb-5">
            <p className="text-sm font-medium text-primary">Browse by</p>
            <h1 id="scopes-heading" className="mt-1 text-3xl font-semibold">
              Scopes
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Follow curated document paths organized into sections and groups.
            </p>
          </div>

          {scopes.length ? (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {scopes.map((scope) => {
                const documentCount = scopeDocumentSlugs(scope).length

                return (
                  <li key={scope.slug}>
                    <Link
                      to={`/scopes/${scope.slug}`}
                      className="group flex h-full flex-col rounded-xl border bg-card p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                      <span className="flex items-start justify-between gap-4">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <ScopeIcon
                            name={scope.icon}
                            fallback={Layers3}
                            className="size-4"
                          />
                        </span>
                        <ArrowUpRight
                          className="size-4 text-muted-foreground transition group-hover:text-primary"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="mt-5 block text-lg font-semibold transition-colors group-hover:text-primary">
                        {scope.title}
                      </span>
                      {scope.description ? (
                        <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                          {scope.description}
                        </span>
                      ) : null}
                      <span className="mt-4 block text-xs font-medium text-muted-foreground">
                        {documentCountLabel(documentCount)}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="py-16 text-center">
              <h2 className="font-semibold">No scopes found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a scope.json file under docs/_scopes to create one.
              </p>
            </div>
          )}
        </section>
      </main>
    </DocsShell>
  )
}

function ScopeDocumentLink({
  reference,
  scope,
  documentsBySlug,
}: {
  reference: ScopeDocumentReference
  scope: ScopeDefinition
  documentsBySlug: Map<string, DocumentEntry>
}) {
  const document = documentsBySlug.get(reference.slug)
  if (!document) return null

  return (
    <Link
      to={documentHref(document.slug, scope.slug)}
      className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted"
    >
      <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground transition group-hover:border-primary/40 group-hover:text-primary">
        <ScopeIcon
          name={reference.icon}
          fallback={FileText}
          className="size-3.5"
        />
      </span>
      <span className="min-w-0">
        <span className="font-medium transition-colors group-hover:text-primary">
          {document.frontmatter.title}
        </span>
        {document.frontmatter.description ? (
          <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">
            {document.frontmatter.description}
          </span>
        ) : null}
      </span>
      <ArrowRight
        className="mt-2 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  )
}

function ScopeGroup({
  group,
  scope,
  documentsBySlug,
}: {
  group: ScopeGroupDefinition
  scope: ScopeDefinition
  documentsBySlug: Map<string, DocumentEntry>
}) {
  const groupDocument = group.document
    ? documentsBySlug.get(group.document.slug)
    : undefined
  const title = group.title ?? groupDocument?.frontmatter.title ?? group.id
  const description =
    group.description ?? groupDocument?.frontmatter.description ?? ""
  const headingContent = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ScopeIcon
          name={group.icon ?? group.document?.icon}
          fallback={FolderTree}
          className="size-4"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-semibold">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      {groupDocument ? (
        <ArrowUpRight
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      ) : null}
    </>
  )

  return (
    <section
      id={`${scope.slug}-${group.id}`}
      className="overflow-hidden rounded-xl border bg-card"
      aria-labelledby={`${scope.slug}-${group.id}-heading`}
    >
      <h3 id={`${scope.slug}-${group.id}-heading`}>
        {groupDocument ? (
          <Link
            to={documentHref(groupDocument.slug, scope.slug)}
            className="group flex items-start gap-3 border-b p-4 transition-colors hover:bg-muted"
          >
            {headingContent}
          </Link>
        ) : (
          <span className="flex items-start gap-3 border-b p-4">
            {headingContent}
          </span>
        )}
      </h3>

      {group.documents.length ? (
        <ul className="divide-y p-1">
          {group.documents.map((reference) => (
            <li key={reference.slug}>
              <ScopeDocumentLink
                reference={reference}
                scope={scope}
                documentsBySlug={documentsBySlug}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export function ScopePage({
  scope,
  documents,
}: {
  scope: ScopeDefinition
  documents: DocumentEntry[]
}) {
  const documentsBySlug = new Map(
    documents.map((document) => [document.slug, document])
  )
  const documentCount = scopeDocumentSlugs(scope).length

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
          <Link
            to="/scopes"
            className="transition-colors hover:text-foreground"
          >
            Scopes
          </Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <span className="text-foreground">{scope.title}</span>
        </nav>

        <header className="flex items-start gap-4 border-b pb-8">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ScopeIcon
              name={scope.icon}
              fallback={Layers3}
              className="size-5"
            />
          </span>
          <div>
            <p className="text-sm font-medium text-primary">Scope</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              {scope.title}
            </h1>
            {scope.description ? (
              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                {scope.description}
              </p>
            ) : null}
            <p className="mt-3 text-sm text-muted-foreground">
              {documentCountLabel(documentCount)}
            </p>
          </div>
        </header>

        {scope.sections.length ? (
          <div className="mt-10 space-y-12">
            {scope.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
              >
                <div className="flex items-start gap-3 border-b pb-4">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <ScopeIcon name={section.icon} className="size-4" />
                  </span>
                  <div>
                    <h2
                      id={`${section.id}-heading`}
                      className="text-xl font-semibold"
                    >
                      {section.title}
                    </h2>
                    {section.description ? (
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {section.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                {section.documents.length ? (
                  <ul className="mt-3 divide-y">
                    {section.documents.map((reference) => (
                      <li key={reference.slug}>
                        <ScopeDocumentLink
                          reference={reference}
                          scope={scope}
                          documentsBySlug={documentsBySlug}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.groups.length ? (
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {section.groups.map((group) => (
                      <ScopeGroup
                        key={group.id}
                        group={group}
                        scope={scope}
                        documentsBySlug={documentsBySlug}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            This scope does not contain any sections yet.
          </p>
        )}
      </main>
    </DocsShell>
  )
}
