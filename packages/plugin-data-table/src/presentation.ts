import type { CSSProperties } from "react"

const BADGE_COLORS: Record<string, { background: string; foreground: string }> =
  {
    gray: { background: "#e5e7eb", foreground: "#1f2937" },
    red: { background: "#fee2e2", foreground: "#991b1b" },
    orange: { background: "#ffedd5", foreground: "#9a3412" },
    amber: { background: "#fef3c7", foreground: "#92400e" },
    yellow: { background: "#fef9c3", foreground: "#854d0e" },
    green: { background: "#dcfce7", foreground: "#166534" },
    blue: { background: "#dbeafe", foreground: "#1e40af" },
    purple: { background: "#f3e8ff", foreground: "#6b21a8" },
    pink: { background: "#fce7f3", foreground: "#9d174d" },
  }

function customForeground(hex: string) {
  const value = hex.slice(1)
  const expanded =
    value.length === 3
      ? value
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : value
  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150
    ? "#111827"
    : "#ffffff"
}

export function badgeColors(color?: string) {
  const normalized = color?.trim().toLowerCase() || "gray"
  const semantic = BADGE_COLORS[normalized]
  if (semantic) return semantic
  if (/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(normalized)) {
    return {
      background: normalized,
      foreground: customForeground(normalized),
    }
  }
  return BADGE_COLORS.gray!
}

export function badgeStyle(color?: string): CSSProperties {
  const colors = badgeColors(color)
  return {
    backgroundColor: colors.background,
    color: colors.foreground,
    borderColor: `color-mix(in srgb, ${colors.foreground} 22%, transparent)`,
  }
}
