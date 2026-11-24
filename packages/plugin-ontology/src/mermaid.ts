import type { selectGraph } from "./graph.js"

// Encode all punctuation so document metadata cannot introduce Mermaid syntax.
export function mermaidText(value: string) {
  return Array.from(value, (char) =>
    /[a-zA-Z0-9 ]/.test(char) ? char : `#${char.codePointAt(0)};`
  ).join("")
}

export function graphToMermaid(
  graph: ReturnType<typeof selectGraph>,
  titles: ReadonlyMap<string, string>
) {
  const ids = new Map(graph.documents.map((doc, i) => [doc.slug, `n${i}`]))
  const lines = [
    "flowchart LR",
    "classDef document fill:#fff,stroke:#333,stroke-width:1px,color:#000",
    "classDef subject fill:#fff,stroke:#333,stroke-width:2px,color:#000",
  ]
  for (const doc of graph.documents) {
    lines.push(
      `${ids.get(doc.slug)}["${mermaidText(doc.frontmatter.title)}"]:::${graph.subjects.has(doc.slug) ? "subject" : "document"}`
    )
  }
  for (const [index, edge] of graph.edges.entries()) {
    const arrow =
      edge.subjectEnd === "arrow"
        ? edge.relatedEnd === "arrow"
          ? "<-->"
          : "-->"
        : edge.relatedEnd === "arrow"
          ? "-->"
          : "---"
    const reverse = edge.subjectEnd === "arrow" && edge.relatedEnd === "none"
    lines.push(
      `${ids.get(reverse ? edge.relatedDoc : edge.subject)} e${index}@${arrow}|"${mermaidText(titles.get(edge.relationSlug) ?? edge.relationSlug)}"| ${ids.get(reverse ? edge.subject : edge.relatedDoc)}`
    )
  }
  return { source: lines.join("\n"), ids }
}
