import { ArrowRight, BookOpen } from "lucide-react"
import { Link } from "react-router"

export function meta() {
  return [
    { title: "The Docs" },
    {
      name: "description",
      content: "File-based documentation for SpaceCode projects and customers.",
    },
  ]
}

export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <BookOpen className="size-6" aria-hidden="true" />
        </div>
        <p className="mb-4 text-sm font-semibold text-primary">The Docs</p>
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          Documentation that ships with your code.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
          Build clear, version-controlled guides from MDX and publish them as a
          fast React application.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/docs/p/getting-started"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Read the getting started guide
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            to="/docs/p/package-boundaries"
            className="inline-flex items-center rounded-lg border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Explore package boundaries
          </Link>
        </div>
      </div>
    </main>
  )
}
