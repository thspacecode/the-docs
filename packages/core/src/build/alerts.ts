import type { Element, Root } from "hast"

/** Marks GitHub alerts while keeping their Markdown content intact. */
export function rehypeAlerts() {
  return (tree: Root) => {
    function visit(node: Root | Element) {
      for (const child of node.children) {
        if (child.type !== "element") continue
        visit(child)
        if (child.tagName !== "blockquote") continue
        const paragraph = child.children.find(
          (entry) => entry.type === "element" && entry.tagName === "p"
        )
        if (paragraph?.type !== "element") continue
        const text = paragraph.children[0]
        if (text?.type !== "text") continue
        const match = text.value.match(
          /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:[\t ]*\n|[\t ]*$)/
        )
        if (!match) continue
        child.properties["data-alert"] = match[1].toLowerCase()
        text.value = text.value.slice(match[0].length)
        if (
          paragraph.children[1]?.type === "element" &&
          paragraph.children[1].tagName === "br" &&
          !text.value
        ) {
          paragraph.children.splice(1, 1)
        }
        if (
          paragraph.children.every(
            (entry) => entry.type === "text" && !entry.value.trim()
          )
        ) {
          child.children.splice(child.children.indexOf(paragraph), 1)
        }
      }
    }
    visit(tree)
  }
}
