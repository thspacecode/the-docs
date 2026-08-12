import { useState } from "react"
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Link } from "react-router"

import type { RelatedDocumentsSection } from "../content/types.js"

const relatedDocumentsPageSize = 3
const modifiedDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
})

function ModifiedDate({ modifiedAt }: { modifiedAt: number }) {
  if (!Number.isFinite(modifiedAt) || modifiedAt <= 0) return null

  return (
    <time dateTime={new Date(modifiedAt).toISOString()}>
      Updated {modifiedDateFormatter.format(modifiedAt)}
    </time>
  )
}

function RelatedDocumentsGroup({
  section,
}: {
  section: RelatedDocumentsSection
}) {
  const [expanded, setExpanded] = useState(section.defaultExpanded)
  const [page, setPage] = useState(0)
  const pageCount = Math.ceil(section.entries.length / relatedDocumentsPageSize)
  const currentPage = Math.min(page, pageCount - 1)
  const visibleEntries = section.entries.slice(
    currentPage * relatedDocumentsPageSize,
    (currentPage + 1) * relatedDocumentsPageSize
  )

  return (
    <details
      className="group border-b first:border-t"
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary className="docs-centered-layout min-h-14 list-none font-semibold transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span className="flex min-h-14 w-full items-center justify-between gap-4">
          <span>
            {section.title}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {section.entries.length}
            </span>
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>

      <div className="docs-centered-layout border-t">
        <div className="w-full">
          <ul>
            {visibleEntries.map(({ document, directlyLinked }) => (
              <li key={document.slug} className="py-5">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <Link
                      to={`/p/${document.slug}`}
                      className="group/link inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-primary"
                    >
                      {document.frontmatter.title}
                      <ArrowUpRight
                        className="size-3.5 opacity-0 transition-opacity group-hover/link:opacity-100"
                        aria-hidden="true"
                      />
                    </Link>
                    {document.frontmatter.description ? (
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {document.frontmatter.description}
                      </p>
                    ) : null}
                    {document.frontmatter.tags.length ? (
                      <ul
                        className="mt-3 flex flex-wrap gap-1.5"
                        aria-label="Tags"
                      >
                        {document.frontmatter.tags.slice(0, 3).map((tag) => (
                          <li
                            key={tag}
                            className="rounded-full border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="flex items-start gap-2 text-xs text-muted-foreground sm:flex-col sm:items-end">
                    {directlyLinked ? (
                      <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
                        Directly linked
                      </span>
                    ) : null}
                    <ModifiedDate modifiedAt={document.modifiedAt} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {pageCount > 1 ? (
            <nav
              className="flex items-center justify-end gap-2 py-3"
              aria-label={`${section.title} pages`}
            >
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                disabled={currentPage === 0}
                className="rounded-md border p-1.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
                aria-label={`Previous ${section.title.toLocaleLowerCase()} page`}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <span className="min-w-16 text-center text-xs text-muted-foreground">
                {currentPage + 1} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((value) => Math.min(pageCount - 1, value + 1))
                }
                disabled={currentPage === pageCount - 1}
                className="rounded-md border p-1.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
                aria-label={`Next ${section.title.toLocaleLowerCase()} page`}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </nav>
          ) : null}
        </div>
      </div>
    </details>
  )
}

export function RelatedDocuments({
  documentSlug,
  sections,
}: {
  documentSlug: string
  sections: RelatedDocumentsSection[]
}) {
  if (!sections.length) return null

  return (
    <aside className="w-full" aria-label="Related documentation">
      {sections.map((section) => (
        <RelatedDocumentsGroup
          key={`${documentSlug}-${section.id}`}
          section={section}
        />
      ))}
    </aside>
  )
}
