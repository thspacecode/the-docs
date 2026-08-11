import {
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Equal,
  type LucideIcon,
} from "lucide-react"

interface ImportanceDetails {
  icon: LucideIcon
  colorClassName: string
}

const importanceDetails: Record<string, ImportanceDetails> = {
  highest: {
    icon: ChevronsUp,
    colorClassName: "text-danger",
  },
  high: {
    icon: ChevronUp,
    colorClassName: "text-danger",
  },
  medium: {
    icon: Equal,
    colorClassName: "text-grey-11",
  },
  low: {
    icon: ChevronDown,
    colorClassName: "text-info",
  },
  lowest: {
    icon: ChevronsDown,
    colorClassName: "text-info",
  },
}

const defaultImportanceDetails: ImportanceDetails = {
  icon: Equal,
  colorClassName: "text-grey-11",
}

export function Importance({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  const { icon: Icon, colorClassName } =
    importanceDetails[value.trim().toLowerCase()] ?? defaultImportanceDetails

  return (
    <span
      className={`inline-flex items-center ${colorClassName}${className ? ` ${className}` : ""}`}
      title={value}
      aria-label={`${value} importance`}
    >
      <Icon className="size-4" strokeWidth={2.25} aria-hidden="true" />
    </span>
  )
}
