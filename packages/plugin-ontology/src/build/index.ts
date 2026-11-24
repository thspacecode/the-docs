import { fileURLToPath } from "node:url"
import type { Program } from "estree"

interface Node {
  type: string
  name?: string
  children?: Node[]
  value?: string
  data?: { estree?: Program }
}

/** Makes <Ontology /> available in MDX without a per-document import. */
export function ontologyRehypePlugin() {
  const runtime = fileURLToPath(new URL("../ontology.js", import.meta.url))
  return (tree: Node) => {
    let used = false
    let imported = false
    function visit(node: Node) {
      if (
        (node.type === "mdxJsxFlowElement" ||
          node.type === "mdxJsxTextElement") &&
        node.name === "Ontology"
      )
        used = true
      if (node.type === "mdxjsEsm") {
        imported ||= Boolean(
          node.data?.estree?.body?.some(
            (statement) =>
              statement.type === "ImportDeclaration" &&
              statement.specifiers?.some(
                (specifier) => specifier.local?.name === "Ontology"
              )
          )
        )
      }
      node.children?.forEach(visit)
    }
    visit(tree)
    if (!used || imported) return
    tree.children?.unshift({
      type: "mdxjsEsm",
      value: `import { Ontology } from ${JSON.stringify(runtime)}`,
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [
            {
              type: "ImportDeclaration",
              attributes: [],
              specifiers: [
                {
                  type: "ImportSpecifier",
                  imported: { type: "Identifier", name: "Ontology" },
                  local: { type: "Identifier", name: "Ontology" },
                },
              ],
              source: {
                type: "Literal",
                value: runtime,
                raw: JSON.stringify(runtime),
              },
            },
          ],
        },
      },
    })
  }
}
