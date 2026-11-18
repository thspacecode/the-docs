import type { ComponentProps } from "react"

import { cn } from "../lib/utils.js"

function Alert({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert"
      role="note"
      className={cn(
        "relative w-full rounded-lg border bg-background p-4 text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("flex items-center gap-2 font-medium", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("mt-2 text-sm leading-relaxed", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
