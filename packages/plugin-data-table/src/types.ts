export const DATA_TABLE_COLUMN_TYPES = [
  "text",
  "numeric",
  "calendar",
  "checkbox",
  "dropdown",
  "color",
  "badgeColor",
  "primaryKey",
  "link",
  "linkedData",
] as const

export type DataTableColumnType = (typeof DATA_TABLE_COLUMN_TYPES)[number]

export type DataTableBadgeOption = {
  value: string
  label?: string
  color?: string
}

export type DataTableColumnMeta = {
  name: string
  title?: string
  type: DataTableColumnType
  width?: number
  source?: string[]
  options?: DataTableBadgeOption[]
  filterable?: boolean
  linkTable?: string
  linkColumn?: string
  displayColumn?: string
  sourceColumn?: string
  linkedDataColumn?: string
}

export type DataTableMeta = {
  version: number
  name: string
  title?: string
  description?: string
  columns: DataTableColumnMeta[]
}

export type DataTableRelationTarget = {
  meta: DataTableMeta
  rows: string[][]
}

export type ResolvedDataTable = {
  rows: string[][]
  displayRows: string[][]
  badgeColorRows: string[][]
  unresolved: boolean[][]
}

/** Serializable data embedded in the compiled MDX document. */
export type DataTableModel = ResolvedDataTable & {
  title: string
  description: string
  columns: DataTableColumnMeta[]
}

export interface DataTablePluginOptions {
  /** Maximum number of body rows included in generated SVG images. */
  imageMaxRows?: number
}
