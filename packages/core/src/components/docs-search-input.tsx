import { Search, X } from "lucide-react"

export const docsSearchInputId = "docs-search"

export function DocsSearchInput({
  value,
  onValueChange,
  onSubmit,
  label = "Search documentation",
  placeholder = "Search documentation",
  showShortcut = true,
  onActivate,
}: {
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  label?: string
  placeholder?: string
  showShortcut?: boolean
  onActivate?: () => void
}) {
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <label htmlFor={docsSearchInputId} className="sr-only">
        {label}
      </label>
      <div className="flex h-11 items-center gap-3 rounded-lg border bg-background px-3 shadow-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
        <Search
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id={docsSearchInputId}
          type="search"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onClick={onActivate}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onValueChange("")}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Clear search"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : showShortcut ? (
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[0.65rem] text-muted-foreground sm:inline">
            Ctrl K
          </kbd>
        ) : null}
      </div>
    </form>
  )
}
