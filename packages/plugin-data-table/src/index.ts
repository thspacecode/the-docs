import { readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

import { defineMdxPlugin, type PluginInput } from "@workspace/plugin-contract"

import {
  dataRows,
  dataTableMetaRef,
  dataTableNameFromRef,
  dataTableTitle,
  isDataTableRef,
  normalizeDataTableMeta,
  parseCsv,
  parseDataTableMeta,
  resolveDataTable,
  validateDataTable,
} from "./model.ts"
import { badgeColors } from "./presentation.ts"
import type {
  DataTableMeta,
  DataTableModel,
  DataTablePluginOptions,
  DataTableRelationTarget,
} from "./types.ts"

export type {
  DataTableBadgeOption,
  DataTableColumnMeta,
  DataTableColumnType,
  DataTableMeta,
  DataTableModel,
  DataTablePluginOptions,
} from "./types.ts"

const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true })

function cleanRelativeRef(ref: string) {
  const withoutQuery = ref.split(/[?#]/, 1)[0] ?? ""
  const decoded = decodeURIComponent(withoutQuery).replaceAll("\\", "/")
  if (
    !decoded ||
    /^(?:[a-z]+:|\/\/|\/)/i.test(decoded) ||
    decoded.split("/").includes("..")
  ) {
    throw new Error(`Data table asset must use a safe relative path: ${ref}`)
  }
  return decoded
}

function assetPath(documentPath: string, ref: string) {
  return resolve(dirname(documentPath), cleanRelativeRef(ref))
}

function relationRef(currentRef: string, configured: string) {
  const value = configured.trim()
  if (!value) return value
  if (value.includes("/")) return value.startsWith("./") ? value : `./${value}`

  const file = value.toLowerCase().endsWith(".csv")
    ? value
    : `data-${value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")}.csv`
  const cleanCurrentRef = currentRef.split(/[?#]/, 1)[0] ?? currentRef
  const separator = cleanCurrentRef.lastIndexOf("/")
  const directory =
    separator >= 0 ? cleanCurrentRef.slice(0, separator + 1) : ""
  return `${directory}${file}`
}

async function readMeta(path: string) {
  try {
    return parseDataTableMeta(decoder.decode(await readFile(path)))
  } catch {
    // A companion metadata file is optional for plain CSV compatibility.
    return {}
  }
}

async function loadRelationTargets(
  documentPath: string,
  currentRef: string,
  meta: DataTableMeta
) {
  const configuredRefs = [
    ...new Set(
      meta.columns
        .filter((column) => column.type === "link" && column.linkTable)
        .map((column) => column.linkTable as string)
    ),
  ]
  const targets = new Map<string, DataTableRelationTarget>()

  await Promise.all(
    configuredRefs.map(async (configuredRef) => {
      try {
        const targetRef = relationRef(currentRef, configuredRef)
        const targetPath = assetPath(documentPath, targetRef)
        const parsed = parseCsv(decoder.decode(await readFile(targetPath)))
        const targetMeta = normalizeDataTableMeta(
          await readMeta(dataTableMetaRef(targetPath)),
          parsed,
          dataTableNameFromRef(targetRef)
        )
        targets.set(configuredRef, {
          meta: targetMeta,
          rows: dataRows(parsed, targetMeta),
        })
      } catch {
        // Missing relation targets are represented as unresolved cells.
      }
    })
  )

  return targets
}

async function parseDataTableInput(
  input: PluginInput
): Promise<DataTableModel> {
  if (
    input.kind !== "asset" ||
    input.extension.toLowerCase() !== ".csv" ||
    !isDataTableRef(input.url)
  ) {
    throw new TypeError(
      "The data table plugin only accepts data-<name>.csv assets"
    )
  }

  const parsed = parseCsv(decoder.decode(input.content))
  if (!parsed.length || !parsed[0]?.length) {
    throw new Error("Data table must contain a header row")
  }

  const csvPath = assetPath(input.documentPath, input.url)
  const meta = normalizeDataTableMeta(
    await readMeta(dataTableMetaRef(csvPath)),
    parsed,
    dataTableNameFromRef(input.url)
  )
  const rows = dataRows(parsed, meta)
  const errors = validateDataTable(rows, meta)
  if (errors.length) {
    throw new Error(`Invalid data table ${input.url}: ${errors.join(" ")}`)
  }

  const targets = await loadRelationTargets(input.documentPath, input.url, meta)
  return {
    title: meta.title || dataTableTitle(meta.name),
    description: meta.description || "",
    columns: meta.columns,
    ...resolveDataTable(rows, meta, targets),
  }
}

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function renderDataTableSvg(
  model: DataTableModel,
  maxRows: number,
  dark: boolean
) {
  const rows = model.displayRows.slice(0, maxRows)
  const truncated = rows.length < model.displayRows.length
  const widths = model.columns.map((column) =>
    Math.min(360, Math.max(100, column.width ?? 160))
  )
  const width = widths.reduce((sum, value) => sum + value, 0)
  const titleHeight = 48
  const rowHeight = 36
  const footerHeight = truncated ? 32 : 0
  const height = titleHeight + rowHeight * (rows.length + 1) + footerHeight
  const background = dark ? "#171717" : "#ffffff"
  const foreground = dark ? "#f5f5f5" : "#171717"
  const muted = dark ? "#262626" : "#f5f5f5"
  const border = dark ? "#404040" : "#d4d4d4"

  let x = 0
  const header = model.columns
    .map((column, index) => {
      const cell = `<rect x="${x}" y="${titleHeight}" width="${widths[index]}" height="${rowHeight}" fill="${muted}" stroke="${border}"/><text x="${x + 10}" y="${titleHeight + 23}" font-weight="600">${escapeXml(column.title || column.name)}</text>`
      x += widths[index] ?? 0
      return cell
    })
    .join("")

  const body = rows
    .map((row, rowIndex) => {
      x = 0
      const y = titleHeight + rowHeight * (rowIndex + 1)
      return model.columns
        .map((_, columnIndex) => {
          const value = String(row[columnIndex] ?? "")
          const badgeColor = model.badgeColorRows[rowIndex]?.[columnIndex] ?? ""
          const maxCharacters = Math.max(
            8,
            Math.floor((widths[columnIndex] ?? 100) / 8)
          )
          const display =
            value.length > maxCharacters
              ? `${value.slice(0, maxCharacters - 1)}…`
              : value
          const colors = badgeColors(badgeColor)
          const fill = badgeColor ? colors.background : background
          const textColor = badgeColor ? colors.foreground : foreground
          const cell = `<rect x="${x}" y="${y}" width="${widths[columnIndex]}" height="${rowHeight}" fill="${fill}" stroke="${border}"/><text x="${x + 10}" y="${y + 23}" fill="${textColor}">${escapeXml(display)}</text>`
          x += widths[columnIndex] ?? 0
          return cell
        })
        .join("")
    })
    .join("")

  const footer = truncated
    ? `<text x="10" y="${height - 10}" opacity="0.65">Showing first ${rows.length} of ${model.displayRows.length} rows</text>`
    : ""
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(model.title)}"><rect width="100%" height="100%" fill="${background}"/><g font-family="ui-sans-serif,system-ui,sans-serif" font-size="13" fill="${foreground}"><text x="10" y="30" font-size="18" font-weight="600">${escapeXml(model.title)}</text>${header}${body}${footer}</g></svg>`
  return { svg, width, height }
}

/** Compiles CSV assets and companion metadata into read-only MDX tables. */
export function dataTablePlugin(options: DataTablePluginOptions = {}) {
  const imageMaxRows = Math.max(
    1,
    Math.min(1000, Math.floor(options.imageMaxRows ?? 100))
  )

  return defineMdxPlugin<DataTableModel>({
    id: "data-table",
    version: "1.0.0",
    targets: [{ kind: "asset", extensions: [".csv"] }],
    async parse(input, context) {
      context.signal?.throwIfAborted()
      const model = await parseDataTableInput(input)
      context.signal?.throwIfAborted()
      return model
    },
    component: {
      load: () => import("./runtime/data-table.tsx"),
    },
    build: {
      async renderToImage(model, renderOptions) {
        if (renderOptions.format !== "svg") {
          throw new TypeError(
            "Data tables currently render build images as SVG"
          )
        }
        const image = renderDataTableSvg(
          model,
          imageMaxRows,
          renderOptions.theme === "dark"
        )
        return {
          content: new TextEncoder().encode(image.svg),
          mediaType: "image/svg+xml",
          width: image.width,
          height: image.height,
        }
      },
    },
  })
}
