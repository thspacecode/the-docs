import type { ComponentProps } from "react"

import { cn } from "@workspace/ui/lib/utils"

export function DocsPageLayout({
  variant = "centered",
  className,
  ...props
}: ComponentProps<"main"> & {
  variant?: "centered" | "rails"
}) {
  return (
    <main
      className={cn(
        "w-full flex-1",
        variant === "rails"
          ? "docs-rail-layout"
          : "docs-centered-layout docs-page-layout-centered",
        className
      )}
      {...props}
    />
  )
}
