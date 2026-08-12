import {
  DATA_TABLE_COLUMN_TYPES,
  type DataTableBadgeOption,
  type DataTableColumnMeta,
  type DataTableColumnType,
  type DataTableMeta,
  type DataTableRelationTarget,
  type ResolvedDataTable,
} from "./types.js"

export * from "./types.js"

export const DATA_TABLE_META_VERSION = 1

function pathOnly(ref: string) {
  return ref.split(/[?#]/, 1)[0] ?? ref
}

export function isDataTableRef(ref: string) {
  return /(?:^|\/)data-[^/]+\.csv$/i.test(pathOnly(ref))
}

export function dataTableMetaRef(ref: string) {
  return pathOnly(ref).replace(/\.csv$/i, ".meta.json")
}

export function dataTableNameFromRef(ref: string) {
  return (
    pathOnly(ref)
      .split("/")
      .at(-1)
      ?.replace(/^data-/i, "")
      .replace(/\.csv$/i, "") ?? "table"
  )
}

export function dataTableTitle(name: string) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

/** Parse RFC 4180-style CSV, including quoted commas, quotes, and newlines. */
export function parseCsv(source: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ""
  let quoted = false
  let endedWithNewline = false

  function pushValue() {
    row.push(value)
    value = ""
  }

  function pushRow() {
    pushValue()
    rows.push(row)
    row = []
    endedWithNewline = true
  }

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          value += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        value += character
      }
      continue
    }

    if (character === '"') {
      quoted = true
      endedWithNewline = false
    } else if (character === ",") {
      pushValue()
      endedWithNewline = false
    } else if (character === "\n") {
      pushRow()
    } else if (character === "\r") {
      pushRow()
      if (source[index + 1] === "\n") index += 1
    } else {
      value += character
      endedWithNewline = false
    }
  }

  if (quoted) throw new Error("CSV contains an unterminated quoted field")
  if (source.length && (!endedWithNewline || row.length || value)) {
    pushValue()
    rows.push(row)
  }
  return rows
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function optionalString(value: unknown) {
  if (typeof value !== "string") return undefined
  return value.trim() || undefined
}

function badgeOptions(value: unknown): DataTableBadgeOption[] | undefined {
  if (!Array.isArray(value)) return undefined
  const used = new Set<string>()
  const result: DataTableBadgeOption[] = []

  for (const input of value) {
    const item = record(input)
    const optionValue = optionalString(item.value)
    if (!optionValue || used.has(optionValue)) continue
    used.add(optionValue)
    result.push({
      value: optionValue,
      ...(optionalString(item.label)
        ? { label: optionalString(item.label) }
        : {}),
      ...(optionalString(item.color)
        ? { color: optionalString(item.color) }
        : {}),
    })
  }
  return result.length ? result : undefined
}

function columnName(value: unknown, fallback: string) {
  return (
    String(value ?? "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^A-Za-z0-9_.-]+/g, "_")
      .replace(/^_+|_+$/g, "") || fallback
  )
}

function uniqueName(value: unknown, fallback: string, used: Set<string>) {
  const base = columnName(value, fallback)
  let candidate = base
  let suffix = 1
  while (used.has(candidate.toLowerCase())) candidate = `${base}_${suffix++}`
  used.add(candidate.toLowerCase())
  return candidate
}

export function parseDataTableMeta(source: string): unknown {
  try {
    return JSON.parse(source)
  } catch {
    return {}
  }
}

/** Normalize optional metadata against the CSV header for plain-CSV support. */
export function normalizeDataTableMeta(
  input: unknown,
  csvRows: readonly (readonly string[])[],
  fallbackName: string
): DataTableMeta {
  const raw = record(input)
  const rawColumns = Array.isArray(raw.columns) ? raw.columns : []
  const header = csvRows[0] ?? []
  const widest = csvRows.reduce((size, row) => Math.max(size, row.length), 0)
  const count = Math.max(1, header.length, rawColumns.length, widest)
  const used = new Set<string>()
  const columns: DataTableColumnMeta[] = []

  for (let index = 0; index < count; index += 1) {
    const item = record(rawColumns[index])
    const name = uniqueName(
      item.name ?? header[index],
      `column_${index + 1}`,
      used
    )
    const title = String(item.title ?? header[index] ?? name).trim()
    const type = DATA_TABLE_COLUMN_TYPES.includes(
      item.type as DataTableColumnType
    )
      ? (item.type as DataTableColumnType)
      : "text"
    const width = Number(item.width)
    const options = badgeOptions(item.options)

    columns.push({
      name,
      ...(title && title !== name ? { title } : {}),
      type,
      ...(Number.isFinite(width) && width > 0 ? { width } : {}),
      ...(Array.isArray(item.source)
        ? { source: item.source.map(String).filter(Boolean) }
        : {}),
      ...(options ? { options } : {}),
      ...(item.filterable === true ? { filterable: true } : {}),
      ...(optionalString(item.linkTable)
        ? { linkTable: optionalString(item.linkTable) }
        : {}),
      ...(optionalString(item.linkColumn)
        ? { linkColumn: optionalString(item.linkColumn) }
        : {}),
      ...(optionalString(item.displayColumn)
        ? { displayColumn: optionalString(item.displayColumn) }
        : {}),
      ...(optionalString(item.sourceColumn)
        ? { sourceColumn: optionalString(item.sourceColumn) }
        : {}),
      ...(optionalString(item.linkedDataColumn)
        ? { linkedDataColumn: optionalString(item.linkedDataColumn) }
        : {}),
    })
  }

  const name = columnName(raw.name, fallbackName || "table")
  const title = String(raw.title ?? dataTableTitle(name)).trim()
  const description = String(raw.description ?? "").trim()
  return {
    version: DATA_TABLE_META_VERSION,
    name,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    columns,
  }
}

export function dataRows(
  csvRows: readonly (readonly string[])[],
  meta: DataTableMeta
) {
  return csvRows
    .slice(1)
    .map((row) => meta.columns.map((_, index) => String(row[index] ?? "")))
}

function columnIndex(meta: DataTableMeta, name: string | undefined) {
  if (!name) return -1
  return meta.columns.findIndex((column) => column.name === name)
}

function targetKeyIndex(target: DataTableRelationTarget, name?: string) {
  const configured = columnIndex(target.meta, name)
  if (configured >= 0) return configured
  return target.meta.columns.findIndex((column) => column.type === "primaryKey")
}

export function normalizeBadgeColor(value: string) {
  const trimmed = value.trim()
  const shortHex = /^#([0-9a-f]{3})$/i.exec(trimmed)?.[1]
  if (shortHex) {
    return `#${shortHex
      .split("")
      .map((character) => `${character}${character}`)
      .join("")}`.toUpperCase()
  }
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed.toUpperCase() : trimmed
}

export function badgePresentation(column: DataTableColumnMeta, value: string) {
  const normalized = normalizeBadgeColor(value)
  const option = column.options?.find((item) => item.value === normalized)
  return {
    label: option?.label || normalized,
    color: /^#[0-9A-F]{6}$/.test(normalized)
      ? normalized
      : (option?.color ?? normalized),
  }
}

/** Resolve links and derived columns without changing the stored CSV values. */
export function resolveDataTable(
  rows: readonly (readonly string[])[],
  meta: DataTableMeta,
  targets: ReadonlyMap<string, DataTableRelationTarget>
): ResolvedDataTable {
  const normalizedRows = rows.map((row) =>
    meta.columns.map((_, index) => String(row[index] ?? ""))
  )
  const displayRows = normalizedRows.map((row) => [...row])
  const badgeColorRows = normalizedRows.map((row) => row.map(() => ""))
  const unresolved = normalizedRows.map((row) => row.map(() => false))
  const firstLink = meta.columns.find((column) => column.type === "link")

  meta.columns.forEach((column, targetColumnIndex) => {
    if (column.type === "badgeColor") {
      normalizedRows.forEach((row, rowIndex) => {
        const presentation = badgePresentation(
          column,
          row[targetColumnIndex] ?? ""
        )
        displayRows[rowIndex]![targetColumnIndex] = presentation.label
        badgeColorRows[rowIndex]![targetColumnIndex] = presentation.color
      })
      return
    }

    if (column.type === "link") {
      const target = column.linkTable
        ? targets.get(column.linkTable)
        : undefined
      const keyIndex = target ? targetKeyIndex(target, column.linkColumn) : -1
      const configuredLabelIndex = target
        ? columnIndex(target.meta, column.displayColumn)
        : -1
      const labelIndex =
        configuredLabelIndex >= 0 ? configuredLabelIndex : keyIndex
      const displayColumn = target?.meta.columns[labelIndex]

      normalizedRows.forEach((row, rowIndex) => {
        const key = row[targetColumnIndex] ?? ""
        if (!key) return
        const linkedRow =
          target && keyIndex >= 0
            ? target.rows.find((candidate) => candidate[keyIndex] === key)
            : undefined
        if (!linkedRow || labelIndex < 0) {
          unresolved[rowIndex]![targetColumnIndex] = true
          return
        }

        if (displayColumn?.type === "badgeColor") {
          const presentation = badgePresentation(
            displayColumn,
            linkedRow[labelIndex] ?? ""
          )
          displayRows[rowIndex]![targetColumnIndex] = presentation.label
          badgeColorRows[rowIndex]![targetColumnIndex] = presentation.color
        } else {
          displayRows[rowIndex]![targetColumnIndex] =
            linkedRow[labelIndex] ?? key
        }
      })
      return
    }

    if (column.type !== "linkedData") return
    const source =
      meta.columns.find(
        (candidate) =>
          candidate.type === "link" && candidate.name === column.sourceColumn
      ) ?? firstLink
    const sourceIndex = source ? meta.columns.indexOf(source) : -1
    const target = source?.linkTable ? targets.get(source.linkTable) : undefined
    const keyIndex = target ? targetKeyIndex(target, source?.linkColumn) : -1
    const valueIndex = target
      ? columnIndex(target.meta, column.linkedDataColumn)
      : -1

    normalizedRows.forEach((row, rowIndex) => {
      const key = sourceIndex >= 0 ? (row[sourceIndex] ?? "") : ""
      if (!key) {
        displayRows[rowIndex]![targetColumnIndex] = ""
        return
      }
      const linkedRow =
        target && keyIndex >= 0
          ? target.rows.find((candidate) => candidate[keyIndex] === key)
          : undefined
      if (!linkedRow || valueIndex < 0) {
        displayRows[rowIndex]![targetColumnIndex] = ""
        unresolved[rowIndex]![targetColumnIndex] = true
        return
      }

      const value = linkedRow[valueIndex] ?? ""
      const valueColumn = target?.meta.columns[valueIndex]
      if (valueColumn?.type === "badgeColor") {
        const presentation = badgePresentation(valueColumn, value)
        displayRows[rowIndex]![targetColumnIndex] = presentation.label
        badgeColorRows[rowIndex]![targetColumnIndex] = presentation.color
      } else {
        displayRows[rowIndex]![targetColumnIndex] = value
      }
    })
  })

  return { rows: normalizedRows, displayRows, badgeColorRows, unresolved }
}

export function validateDataTable(
  rows: readonly (readonly string[])[],
  meta: DataTableMeta
) {
  const errors: string[] = []
  const primaryKeys = meta.columns.filter(
    (column) => column.type === "primaryKey"
  )
  if (primaryKeys.length > 1) {
    errors.push("A data table can only have one primary key column.")
  }

  meta.columns.forEach((column, columnIndex) => {
    if (column.type === "link" && (!column.linkTable || !column.linkColumn)) {
      errors.push(
        `Link column “${column.title || column.name}” requires a target table and key column.`
      )
    }
    if (column.type === "linkedData") {
      const source = meta.columns.find(
        (candidate) =>
          candidate.type === "link" && candidate.name === column.sourceColumn
      )
      if (!source || !column.linkedDataColumn) {
        errors.push(
          `Linked data column “${column.title || column.name}” requires a link source and target column.`
        )
      }
    }
    if (column.type !== "primaryKey") return

    const seen = new Map<string, number>()
    rows.forEach((row, rowIndex) => {
      const value = String(row[columnIndex] ?? "").trim()
      if (!value) {
        errors.push(
          `Primary key “${column.title || column.name}” is empty in row ${rowIndex + 1}.`
        )
        return
      }
      const duplicate = seen.get(value)
      if (duplicate !== undefined) {
        errors.push(
          `Primary key “${column.title || column.name}” value “${value}” is duplicated in rows ${duplicate + 1} and ${rowIndex + 1}.`
        )
      } else {
        seen.set(value, rowIndex)
      }
    })
  })

  return errors
}
