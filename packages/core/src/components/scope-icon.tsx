import { Shapes, type LucideIcon } from "lucide-react"

import { getScopeIcon } from "../content/registry.js"

export function ScopeIcon({
  name,
  fallback: Fallback = Shapes,
  className = "size-4",
}: {
  name?: string
  fallback?: LucideIcon
  className?: string
}) {
  const Icon = name ? getScopeIcon(name) : undefined
  const ResolvedIcon = Icon ?? Fallback

  return <ResolvedIcon className={className} aria-hidden="true" />
}
