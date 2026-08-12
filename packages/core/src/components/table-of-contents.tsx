import { useEffect, useRef, useState } from "react"
import { ChevronRight, ListTree } from "lucide-react"

import type { TableOfContentsItem } from "../content/table-of-contents.js"

function useActiveHeading(items: TableOfContentsItem[]) {
  const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id)

  useEffect(() => {
    if (!items.length) return

    let animationFrame = 0

    function updateActiveHeading() {
      const headingElements = items
        .map(({ id }) => document.getElementById(id))
        .filter((heading): heading is HTMLElement => Boolean(heading))
      const activationOffset = 112
      let nextActiveId: string | undefined = headingElements[0]?.id

      for (const heading of headingElements) {
        if (heading.getBoundingClientRect().top > activationOffset) break
        nextActiveId = heading.id
      }

      const atPageEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      if (atPageEnd) nextActiveId = headingElements.at(-1)?.id

      setActiveId(nextActiveId)
    }

    function handleScroll() {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(updateActiveHeading)
    }

    updateActiveHeading()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [items])

  return activeId
}

function TableOfContentsLinks({
  activeId,
  items,
  onNavigate,
}: {
  activeId: string | undefined
  items: TableOfContentsItem[]
  onNavigate?: () => void
}) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => {
        const isActive = item.id === activeId

        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={isActive ? "location" : undefined}
              onClick={onNavigate}
              className={`flex w-full border-l py-1.5 pr-2 text-[0.8125rem] leading-snug transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset ${
                item.level === 3 ? "pl-7" : "pl-3.5"
              } ${
                isActive
                  ? "border-l-primary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.text}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

export function MobileTableOfContents({
  items,
}: {
  items: TableOfContentsItem[]
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const activeId = useActiveHeading(items)

  return (
    <details
      ref={detailsRef}
      className="group sticky top-16 z-10 max-h-[calc(100svh-4rem)] overflow-y-auto border-b bg-background/95 backdrop-blur-xl 2xl:hidden"
    >
      <summary className="docs-centered-layout cursor-pointer list-none py-3.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2.5">
          <ListTree
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span>On this page</span>
          <ChevronRight
            className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </span>
      </summary>
      <nav aria-label="On this page" className="docs-centered-layout pb-5">
        <div>
          <TableOfContentsLinks
            activeId={activeId}
            items={items}
            onNavigate={() => {
              if (detailsRef.current) detailsRef.current.open = false
            }}
          />
        </div>
      </nav>
    </details>
  )
}

export function DesktopTableOfContents({
  items,
}: {
  items: TableOfContentsItem[]
}) {
  const activeId = useActiveHeading(items)

  return (
    <aside className="docs-layout-right hidden border-l 2xl:block">
      <nav
        aria-label="On this page"
        className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-6 pr-11 pl-4"
      >
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          On this page
        </p>
        <TableOfContentsLinks activeId={activeId} items={items} />
      </nav>
    </aside>
  )
}
