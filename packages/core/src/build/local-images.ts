import type { Element, Root } from "hast"

const localImageExtension =
  /\.(?:apng|avif|bmp|cur|gif|ico|jfif|jpe?g|jxl|pjp|pjpeg|png|svg|webp)$/i
const externalUrl = /^(?:[a-z][a-z\d+.-]*:|\/\/|\/)/i

type Parent = Root | Element

type MdxNode = {
  type: string
  name?: string
  value?: string
  attributes?: unknown[]
  children?: unknown[]
  data?: Record<string, unknown>
  position?: Element["position"]
}

function importNode(identifier: string, source: string): MdxNode {
  return {
    type: "mdxjsEsm",
    value: `import ${identifier} from ${JSON.stringify(source)}`,
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
                local: { type: "Identifier", name: identifier },
              },
            ],
            source: {
              type: "Literal",
              value: source,
              raw: JSON.stringify(source),
            },
          },
        ],
      },
    },
  }
}

function valueExpression(identifier: string, suffix: string) {
  const expression = suffix
    ? {
        type: "BinaryExpression",
        operator: "+",
        left: { type: "Identifier", name: identifier },
        right: {
          type: "Literal",
          value: suffix,
          raw: JSON.stringify(suffix),
        },
      }
    : { type: "Identifier", name: identifier }

  return {
    type: "mdxJsxAttributeValueExpression",
    value: suffix ? `${identifier} + ${JSON.stringify(suffix)}` : identifier,
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [{ type: "ExpressionStatement", expression }],
      },
    },
  }
}

function imageNode(
  node: Element,
  identifier: string,
  suffix: string
): MdxNode {
  const attributes: unknown[] = Object.entries(node.properties)
    .filter(([name, value]) => name !== "src" && value != null && value !== false)
    .map(([name, value]) => ({
      type: "mdxJsxAttribute",
      name,
      value: value === true ? null : String(value),
    }))

  attributes.unshift({
    type: "mdxJsxAttribute",
    name: "src",
    value: valueExpression(identifier, suffix),
  })

  return {
    type: "mdxJsxTextElement",
    name: "img",
    attributes,
    children: [],
    position: node.position,
  }
}

function decodeImagePath(path: string) {
  try {
    return decodeURI(path)
  } catch {
    return path
  }
}

function localImageUrl(node: Element) {
  if (node.tagName !== "img" || typeof node.properties.src !== "string") {
    return
  }

  const url = node.properties.src
  if (externalUrl.test(url)) return

  const suffixIndex = url.search(/[?#]/)
  const source = suffixIndex < 0 ? url : url.slice(0, suffixIndex)
  if (!source || !localImageExtension.test(source)) return

  return {
    source: decodeImagePath(source),
    suffix: suffixIndex < 0 ? "" : url.slice(suffixIndex),
  }
}

/** Makes relative Markdown images part of Vite's asset graph. */
export function localImagesRehypePlugin() {
  return function attacher() {
    return function transform(tree: Root) {
      const sources = new Map<string, string>()
      const imports: MdxNode[] = []

      const visit = (parent: Parent) => {
        parent.children.forEach((child, index) => {
          if (child.type !== "element") return

          const node = child as Element
          const image = localImageUrl(node)
          if (image) {
            let identifier = sources.get(image.source)
            if (!identifier) {
              identifier = `_theDocsLocalImage${sources.size}`
              sources.set(image.source, identifier)
              imports.push(importNode(identifier, image.source))
            }

            parent.children[index] = imageNode(
              node,
              identifier,
              image.suffix
            ) as never
            return
          }

          visit(node)
        })
      }

      visit(tree)
      if (imports.length) tree.children.unshift(...(imports as never[]))
    }
  }
}
