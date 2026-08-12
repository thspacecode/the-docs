import {
  DocsPageLayout,
  DocsShell,
  getDocuments,
  getScope,
  ScopePage,
} from "@workspace/core"
import {
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
} from "react-router"
import type { LoaderFunctionArgs, MetaFunction } from "react-router"

export function loader({ params }: LoaderFunctionArgs) {
  const scope = params.scopeSlug ? getScope(params.scopeSlug) : undefined

  if (!scope) {
    throw new Response("Scope not found", {
      status: 404,
      statusText: "Not Found",
    })
  }

  return {
    slug: scope.slug,
    title: scope.title,
    description: scope.description,
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? `${data.title} · The Docs` : "The Docs" },
  ...(data?.description
    ? [{ name: "description", content: data.description }]
    : []),
]

export default function ScopeRoute() {
  const { slug } = useLoaderData<typeof loader>()
  const scope = getScope(slug)

  if (!scope) return null

  return <ScopePage scope={scope} documents={getDocuments()} />
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
              Scope not found
            </h1>
            <p className="mt-4 text-muted-foreground">
              The scope may have moved or the address may be incorrect.
            </p>
            <Link
              to="/scopes"
              className="mt-8 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              View scopes
            </Link>
          </div>
        </DocsPageLayout>
      </DocsShell>
    )
  }

  throw error
}
