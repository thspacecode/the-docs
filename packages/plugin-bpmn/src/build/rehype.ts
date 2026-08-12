import { readFile } from "node:fs/promises"
import { dirname, extname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import type { Element, Root } from "hast"

import { bpmnPlugin } from "../index.js"
import type { BpmnPluginOptions } from "../types.js"

const runtimeModuleId = fileURLToPath(
  new URL("../runtime/bpmn-image.js", import.meta.url)
)
const runtimeImport = `import BpmnImage from ${JSON.stringify(runtimeModuleId)}`

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
                local: { type: "Identifier", name: "BpmnImage" },
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

function componentNode(model: unknown, alt: string): MdxNode {
  return {
    type: "mdxJsxFlowElement",
    name: "BpmnImage",
    attributes: [
      {
        type: "mdxJsxAttribute",
        name: "model",
        value: modelExpression(model),
      },
      { type: "mdxJsxAttribute", name: "alt", value: alt },
    ],
    children: [],
  }
}

function bpmnUrl(node: Element) {
  if (node.tagName !== "img" || typeof node.properties.src !== "string") {
    return
  }

  const url = node.properties.src
  if (/^(?:[a-z]+:|\/\/|\/)/i.test(url)) return

  const cleanUrl = decodeURIComponent(url.split(/[?#]/, 1)[0] ?? "")
  if (extname(cleanUrl).toLowerCase() !== ".bpmn") return

  return { cleanUrl, url }
}

/** Replaces Markdown images that reference .bpmn files with generated SVGs. */
export function bpmnRehypePlugin(options: BpmnPluginOptions = {}) {
  const plugin = bpmnPlugin(options)

  return function attacher() {
    return async function transform(tree: Root, file: VFileLike) {
      if (!file.path) {
        throw new Error("BPMN assets require an MDX file path")
      }

      const matches: Array<{
        parent: Parent
        index: number
        node: Element
        cleanUrl: string
        url: string
      }> = []

      const visit = (parent: Parent) => {
        parent.children.forEach((child, index) => {
          if (child.type !== "element") return
          const node = child as Element
          const asset = bpmnUrl(node)
          if (asset) matches.push({ parent, index, node, ...asset })
          visit(node)
        })
      }
      visit(tree)

      if (!matches.length) return

      await Promise.all(
        matches.map(async ({ parent, index, node, cleanUrl, url }) => {
          const assetPath = resolve(dirname(file.path!), cleanUrl)
          const content = await readFile(assetPath)
          const model = await plugin.parse(
            {
              kind: "asset",
              url,
              extension: ".bpmn",
              content,
              documentPath: file.path!,
            },
            {}
          )
          const alt =
            typeof node.properties.alt === "string" ? node.properties.alt : ""
          parent.children[index] = componentNode(model, alt) as never
        })
      )

      tree.children.unshift(importNode() as never)
    }
  }
}
