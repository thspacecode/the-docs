export interface TableOfContentsItem {
  id: string
  text: string
  level: 2 | 3
}

interface HastNode {
  type?: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

function inlineMarkdownToText(value: string) {
  const escapedCharacters: string[] = []
  const text = value
    .replace(/\\([\\`*{}\[\]()#+.!_-])/g, (_match, character: string) => {
      escapedCharacters.push(character)
      return `\uE000${escapedCharacters.length - 1}\uE001`
    })
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/`+([^`]+)`+/g, "$1")
    .replace(/[*_~]/g, "")

  return text
    .replace(/\uE000(\d+)\uE001/g, (_match, index: string) => {
      return escapedCharacters[Number(index)] ?? ""
    })
    .trim()
}

export function headingId(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function uniqueHeadingId(value: string, occurrences: Map<string, number>) {
  const baseId = headingId(value) || "section"
  const count = occurrences.get(baseId) ?? 0
  occurrences.set(baseId, count + 1)
  return count === 0 ? baseId : `${baseId}-${count + 1}`
}

export function extractTableOfContents(
  markdown: string
): TableOfContentsItem[] {
  const items: TableOfContentsItem[] = []
  const occurrences = new Map<string, number>()
  let fence: string | undefined

  for (const line of markdown.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
    if (fenceMatch) {
      const marker = fenceMatch[1][0]
      fence = fence === marker ? undefined : (fence ?? marker)
      continue
    }

    if (fence) continue

    const heading = line.match(/^\s{0,3}(#{2,3})[\t ]+(.+?)[\t ]*#*[\t ]*$/)
    if (!heading) continue

    const text = inlineMarkdownToText(heading[2])
    if (!text) continue

    items.push({
      id: uniqueHeadingId(text, occurrences),
      text,
      level: heading[1].length as 2 | 3,
    })
  }

  return items
}

function hastText(node: HastNode): string {
  if (node.type === "text") return node.value ?? ""
  return node.children?.map(hastText).join("") ?? ""
}

/** Adds stable anchor IDs to the headings included in the table of contents. */
export function rehypeTableOfContentsHeadings() {
  return (tree: HastNode) => {
    const occurrences = new Map<string, number>()

    function visit(node: HastNode) {
      if (node.type === "element" && /h[23]/.test(node.tagName ?? "")) {
        node.properties ??= {}
        node.properties.id = uniqueHeadingId(hastText(node), occurrences)
      }

      node.children?.forEach(visit)
    }

    visit(tree)
  }
}
