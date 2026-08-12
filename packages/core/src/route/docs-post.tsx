import { useEffect, useState } from "react"
import {
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
  useSearchParams,
} from "react-router"
import type { LoaderFunctionArgs, MetaFunction } from "react-router"

import { DocsPageLayout } from "../components/docs-page-layout.js"
import { DocsShell, DocumentPage } from "../components/document-page.js"
import {
  getDocument,
  getDocuments,
  getRelatedDocumentSections,
  getScope,
  getScopes,
  scopeContainsDocument,
} from "../content/registry.js"

export function loader({ params, request }: LoaderFunctionArgs) {
  const document = params.slug ? getDocument(params.slug) : undefined

  if (!document) {
    throw new Response("Document not found", {
      status: 404,
      statusText: "Not Found",
    })
  }

  const requestedScopeSlug = new URL(request.url).searchParams.get("scope")
  const requestedScope = requestedScopeSlug
    ? getScope(requestedScopeSlug)
    : undefined
  const scopeSlug =
    requestedScope && scopeContainsDocument(requestedScope, document.slug)
      ? requestedScope.slug
      : undefined

  return {
    slug: document.slug,
    scopeSlug,
    title: document.frontmatter.title,
    description: document.frontmatter.description,
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? `${data.title} · The Docs` : "The Docs" },
  ...(data?.description
    ? [{ name: "description", content: data.description }]
    : []),
]

export default function DocsPostRoute() {
  const { slug, scopeSlug: loaderScopeSlug } = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  const [hasHydrated, setHasHydrated] = useState(false)
  const document = getDocument(slug)

  useEffect(() => setHasHydrated(true), [])

  const requestedScopeSlug = hasHydrated
    ? searchParams.get("scope")
    : loaderScopeSlug
  const requestedScope = requestedScopeSlug
    ? getScope(requestedScopeSlug)
    : undefined
  const scope =
    document &&
    requestedScope &&
    scopeContainsDocument(requestedScope, document.slug)
      ? requestedScope
      : undefined

  if (!document) {
    return null
  }

  return (
    <DocumentPage
      document={document}
      scope={scope}
      scopes={getScopes()}
      documents={getDocuments()}
      relatedDocumentSections={getRelatedDocumentSections(document.slug)}
    />
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <DocsShell>
        <DocsPageLayout className="py-24">
          <div className="flex flex-col items-start">
            <p className="text-sm font-semibold text-primary">404</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Document not found
            </h1>
            <p className="mt-4 text-muted-foreground">
              The document may have moved or the address may be incorrect.
            </p>
            <Link
              to="/"
              className="mt-8 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Return home
            </Link>
          </div>
        </DocsPageLayout>
      </DocsShell>
    )
  }

  return (
    <DocsShell>
      <DocsPageLayout className="py-24">
        <div>
          <h1 className="text-3xl font-semibold">
            Unable to load this document
          </h1>
          <p className="mt-4 text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
        </div>
      </DocsPageLayout>
    </DocsShell>
  )
}
