import {
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
} from "react-router"
import type { LoaderFunctionArgs, MetaFunction } from "react-router"

import { DocsShell, DocumentPage } from "../components/document-page"
import { getDocument } from "../content/registry"

export function loader({ params }: LoaderFunctionArgs) {
  const document = params.slug ? getDocument(params.slug) : undefined

  if (!document) {
    throw new Response("Document not found", {
      status: 404,
      statusText: "Not Found",
    })
  }

  return {
    slug: document.slug,
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
  const { slug } = useLoaderData<typeof loader>()
  const document = getDocument(slug)

  if (!document) {
    return null
  }

  return <DocumentPage document={document} />
}

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <DocsShell>
        <main className="mx-auto flex max-w-3xl flex-col items-start px-6 py-24">
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
        </main>
      </DocsShell>
    )
  }

  return (
    <DocsShell>
      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-3xl font-semibold">Unable to load this document</h1>
        <p className="mt-4 text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
      </main>
    </DocsShell>
  )
}
