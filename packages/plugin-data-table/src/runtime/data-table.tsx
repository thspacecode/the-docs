import type { PluginComponentProps } from "@workspace/plugin-contract"

import { badgeStyle } from "../presentation.ts"
import type { DataTableModel } from "../types.ts"

interface DataTableProps extends PluginComponentProps<DataTableModel> {
  alt?: string
}

function displayCell(value: string, type: string) {
  if (type !== "checkbox") return value
  return /^(?:1|true|yes|checked)$/i.test(value) ? "Yes" : "No"
}

export default function DataTable({ model, alt }: DataTableProps) {
  const label = alt || model.title

  return (
    <figure className="data-table">
      <div className="data-table-scroll">
        <table>
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr>
              {model.columns.map((column) => (
                <th
                  key={column.name}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.title || column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.length ? (
              model.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {model.columns.map((column, columnIndex) => {
                    const storedValue = row[columnIndex] ?? ""
                    const displayValue = displayCell(
                      model.displayRows[rowIndex]?.[columnIndex] ?? storedValue,
                      column.type
                    )
                    const badgeColor =
                      model.badgeColorRows[rowIndex]?.[columnIndex]
                    const unresolved = model.unresolved[rowIndex]?.[columnIndex]

                    return (
                      <td key={column.name}>
                        {badgeColor ? (
                          <span
                            className="data-table-badge"
                            style={badgeStyle(badgeColor)}
                            title={`Color: ${badgeColor}`}
                          >
                            {displayValue}
                          </span>
                        ) : unresolved ? (
                          <span
                            className="data-table-unresolved"
                            title={`Unresolved value: ${storedValue}`}
                          >
                            {storedValue || "Unresolved"}
                            <span className="sr-only"> (unresolved)</span>
                          </span>
                        ) : (
                          displayValue
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={model.columns.length} className="data-table-empty">
                  No rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <figcaption>
        <span>{label}</span>
        {model.description ? <small>{model.description}</small> : null}
      </figcaption>
    </figure>
  )
}
