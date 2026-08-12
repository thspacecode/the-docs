import { Clock3 } from "lucide-react"

const minute = 60 * 1000
const hour = 60 * minute
const day = 24 * hour
const month = 30 * day
const year = 365 * day
const modifiedDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
})
const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "always",
})

type RelativeTimeUnit = "minute" | "hour" | "day" | "month" | "year"

function relativeTime(
  modifiedAt: number,
  now: number
): { amount: number; abbreviation: string; unit: RelativeTimeUnit } | null {
  if (!Number.isFinite(modifiedAt) || modifiedAt <= 0) return null

  const elapsed = Math.max(0, now - modifiedAt)

  if (elapsed < hour) {
    return {
      amount: Math.max(1, Math.floor(elapsed / minute)),
      abbreviation: "m",
      unit: "minute",
    }
  }
  if (elapsed < day) {
    return {
      amount: Math.floor(elapsed / hour),
      abbreviation: "h",
      unit: "hour",
    }
  }
  if (elapsed < month) {
    return {
      amount: Math.floor(elapsed / day),
      abbreviation: "d",
      unit: "day",
    }
  }
  if (elapsed < year) {
    return {
      amount: Math.floor(elapsed / month),
      abbreviation: "mo",
      unit: "month",
    }
  }

  return {
    amount: Math.floor(elapsed / year),
    abbreviation: "y",
    unit: "year",
  }
}

export function RelativeModifiedTime({
  modifiedAt,
  now,
}: {
  modifiedAt: number
  now: number
}) {
  const relative = relativeTime(modifiedAt, now)
  if (!relative) return null

  return (
    <time
      dateTime={new Date(modifiedAt).toISOString()}
      title={`Updated ${modifiedDateFormatter.format(modifiedAt)}`}
      aria-label={`Updated ${relativeTimeFormatter.format(-relative.amount, relative.unit)}`}
      className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
      suppressHydrationWarning
    >
      <Clock3 className="size-3.5" aria-hidden="true" />
      {relative.amount} {relative.abbreviation}
    </time>
  )
}
