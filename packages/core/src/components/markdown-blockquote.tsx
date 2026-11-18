import type { ComponentProps } from "react"
import {
  CircleAlert,
  Info,
  Lightbulb,
  MessageSquareWarning,
  TriangleAlert,
} from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@the-docs/ui/components/alert"

const alerts = {
  note: {
    title: "Note",
    icon: Info,
    className:
      "border-blue-500/50 [&_[data-slot=alert-title]]:text-blue-600 dark:[&_[data-slot=alert-title]]:text-blue-400",
  },
  tip: {
    title: "Tip",
    icon: Lightbulb,
    className:
      "border-green-500/50 [&_[data-slot=alert-title]]:text-green-600 dark:[&_[data-slot=alert-title]]:text-green-400",
  },
  important: {
    title: "Important",
    icon: MessageSquareWarning,
    className:
      "border-purple-500/50 [&_[data-slot=alert-title]]:text-purple-600 dark:[&_[data-slot=alert-title]]:text-purple-400",
  },
  warning: {
    title: "Warning",
    icon: TriangleAlert,
    className:
      "border-amber-500/50 [&_[data-slot=alert-title]]:text-amber-700 dark:[&_[data-slot=alert-title]]:text-amber-400",
  },
  caution: {
    title: "Caution",
    icon: CircleAlert,
    className:
      "border-red-500/50 [&_[data-slot=alert-title]]:text-red-600 dark:[&_[data-slot=alert-title]]:text-red-400",
  },
}

type Props = ComponentProps<"blockquote"> & { "data-alert"?: string }

export function MarkdownBlockquote({
  "data-alert": kind,
  children,
  ...props
}: Props) {
  const alert =
    kind && Object.hasOwn(alerts, kind)
      ? alerts[kind as keyof typeof alerts]
      : undefined
  if (!alert) return <blockquote {...props}>{children}</blockquote>
  const Icon = alert.icon
  return (
    <Alert className={alert.className} data-alert={kind}>
      <AlertTitle>
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {alert.title}
      </AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
