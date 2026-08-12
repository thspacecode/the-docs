import { fileURLToPath } from "node:url"

import type { Element, Root, Text } from "hast"

import { mermaidPlugin } from "../index.js"
import type { MermaidPluginOptions } from "../types.js"

const runtimeModuleId = fileURLToPath(
  new URL("../runtime/mermaid-image.js", import.meta.url)
)
const runtimeImport = `import MermaidImage from ${JSON.stringify(runtimeModuleId)}`

type Parent = Root | Element

type MdxNode = {
  type: string
  name?: string
  value?: string
  attributes?: unknown[]
  children?: unknown[]
  data?: Record<string, unknown>
}

interface VFileLike {
  path?: string
}

function importNode(): MdxNode {
  return {
    type: "mdxjsEsm",
    value: runtimeImport,
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ImportDeclaration",
            specifiers: [
              {
                type: "ImportDefaultSpecifier",
                local: { type: "Identifier", name: "MermaidImage" },
              },
            ],
            source: {
              type: "Literal",
              value: runtimeModuleId,
              raw: JSON.stringify(runtimeModuleId),
            },
          },
        ],
      },
    },
  }
}

function modelExpression(model: unknown) {
  const serialized = JSON.stringify(model)
  const source = `JSON.parse(${JSON.stringify(serialized)})`

  return {
    type: "mdxJsxAttributeValueExpression",
    value: source,
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              optional: false,
              callee: {
                type: "MemberExpression",
                computed: false,
                optional: false,
                object: { type: "Identifier", name: "JSON" },
                property: { type: "Identifier", name: "parse" },
              },
              arguments: [
                {
                  type: "Literal",
                  value: serialized,
                  raw: JSON.stringify(serialized),
                },
              ],
            },
          },
        ],
      },
    },
  }
}

function componentNode(model: unknown): MdxNode {
  return {
    type: "mdxJsxFlowElement",
    name: "MermaidImage",
    attributes: [
      {
        type: "mdxJsxAttribute",
        name: "model",
        value: modelExpression(model),
      },
    ],
    children: [],
  }
}

function hasMermaidLanguage(node: Element) {
  const className = node.properties.className
  const classes = (Array.isArray(className) ? className : [className])
    .flatMap((value) => String(value ?? "").split(/\s+/))
    .filter(Boolean)

  return classes.includes("language-mermaid")
}

function mermaidCode(node: Element) {
  if (node.tagName !== "pre") return

  const code = node.children.find(
    (child): child is Element =>
      child.type === "element" &&
      child.tagName === "code" &&
      hasMermaidLanguage(child)
  )
  if (!code) return

  return code.children
    .filter((child): child is Text => child.type === "text")
    .map((child) => child.value)
    .join("")
}

/** Replaces `mermaid` code fences with SVG-backed image components. */
export function mermaidRehypePlugin(options: MermaidPluginOptions = {}) {
  const plugin = mermaidPlugin(options)

  return function attacher() {
    return async function transform(tree: Root, file: VFileLike) {
      const matches: Array<{
        parent: Parent
        index: number
        source: string
      }> = []

      const visit = (parent: Parent) => {
        parent.children.forEach((child, index) => {
          if (child.type !== "element") return
          const node = child as Element
          const source = mermaidCode(node)
          if (source !== undefined) {
            matches.push({ parent, index, source })
            return
          }
          visit(node)
        })
      }
      visit(tree)

      if (!matches.length) return

      await Promise.all(
        matches.map(async ({ parent, index, source }) => {
          const model = await plugin.parse(
            {
              kind: "code-fence",
              language: "mermaid",
              content: source,
              documentPath: file.path ?? "",
            },
            {}
          )
          parent.children[index] = componentNode(model) as never
        })
      )

      tree.children.unshift(importNode() as never)
    }
  }
}
