import { readFile } from "node:fs/promises"
import { TextDecoder, TextEncoder } from "node:util"

import { JSDOM, VirtualConsole } from "jsdom"

import type { MermaidTheme } from "../types.ts"

export interface RenderMermaidOptions {
  theme?: MermaidTheme
  signal?: AbortSignal
}

export interface RenderedMermaidSvg {
  svg: string
  width: number
  height: number
}

let mermaidBrowserSource: Promise<string> | undefined

function loadMermaidBrowserSource() {
  mermaidBrowserSource ??= readFile(
    new URL(import.meta.resolve("mermaid/dist/mermaid.min.js")),
    "utf8"
  )
  return mermaidBrowserSource
}

/*
 * Mermaid measures SVG labels and groups while laying out a diagram. JSDOM
 * deliberately does not implement SVG geometry, so provide the small geometry
 * surface Mermaid needs. Group bounds are derived from their rendered children,
 * which also gives Mermaid an accurate final viewBox.
 */
const svgGeometryPolyfill = String.raw`
function mermaidBox(x = 0, y = 0, width = 0, height = 0) {
  return { x, y, width, height }
}
function mermaidNumbers(value) {
  return (value || "").match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) || []
}
function mermaidUnion(boxes) {
  const valid = boxes.filter((box) =>
    box && Number.isFinite(box.x) && Number.isFinite(box.y) &&
    (box.width || box.height)
  )
  if (!valid.length) return mermaidBox()
  const x = Math.min(...valid.map((box) => box.x))
  const y = Math.min(...valid.map((box) => box.y))
  const right = Math.max(...valid.map((box) => box.x + box.width))
  const bottom = Math.max(...valid.map((box) => box.y + box.height))
  return mermaidBox(x, y, right - x, bottom - y)
}
function mermaidTransformBox(value, box) {
  let a = 1, b = 0, c = 0, d = 1, e = 0, f = 0
  for (const part of (value || "").matchAll(/(matrix|translate|scale|rotate)\s*\(([^)]*)\)/g)) {
    const values = mermaidNumbers(part[2])
    let matrix = [1, 0, 0, 1, 0, 0]
    if (part[1] === "matrix") matrix = values.slice(0, 6)
    if (part[1] === "translate") matrix = [1, 0, 0, 1, values[0] || 0, values[1] || 0]
    if (part[1] === "scale") matrix = [values[0] ?? 1, 0, 0, values[1] ?? values[0] ?? 1, 0, 0]
    if (part[1] === "rotate") {
      const radians = (values[0] || 0) * Math.PI / 180
      const cosine = Math.cos(radians)
      const sine = Math.sin(radians)
      const x = values[1] || 0
      const y = values[2] || 0
      matrix = [
        cosine, sine, -sine, cosine,
        x - x * cosine + y * sine,
        y - x * sine - y * cosine,
      ]
    }
    const [ma, mb, mc, md, me, mf] = matrix
    ;[a, b, c, d, e, f] = [
      ma * a + mc * b,
      mb * a + md * b,
      ma * c + mc * d,
      mb * c + md * d,
      ma * e + mc * f + me,
      mb * e + md * f + mf,
    ]
  }
  const points = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ].map(([x, y]) => [a * x + c * y + e, b * x + d * y + f])
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  return mermaidBox(
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  )
}
SVGElement.prototype.getBBox = function () {
  const tag = this.tagName.toLowerCase()
  const number = (name) => Number(this.getAttribute(name)) || 0
  if (tag === "text" || tag === "tspan") {
    const size = Number.parseFloat(getComputedStyle(this).fontSize) || 16
    return mermaidBox(
      number("x"),
      number("y") - size * 0.8,
      Math.max(1, (this.textContent || "").length * size * 0.6),
      size,
    )
  }
  if (tag === "rect" || tag === "image" || tag === "foreignobject") {
    return mermaidBox(number("x"), number("y"), number("width"), number("height"))
  }
  if (tag === "circle") {
    const radius = number("r")
    return mermaidBox(number("cx") - radius, number("cy") - radius, radius * 2, radius * 2)
  }
  if (tag === "ellipse") {
    return mermaidBox(
      number("cx") - number("rx"),
      number("cy") - number("ry"),
      number("rx") * 2,
      number("ry") * 2,
    )
  }
  if (tag === "line") {
    return mermaidUnion([
      mermaidBox(number("x1"), number("y1"), 1, 1),
      mermaidBox(number("x2"), number("y2"), 1, 1),
    ])
  }
  if (tag === "polygon" || tag === "polyline" || tag === "path") {
    const values = mermaidNumbers(
      this.getAttribute(tag === "path" ? "d" : "points"),
    )
    const points = []
    for (let index = 0; index < values.length; index += 2) {
      points.push(mermaidBox(values[index], values[index + 1], 1, 1))
    }
    return mermaidUnion(points)
  }
  const children = mermaidUnion(
    Array.from(this.children)
      .filter((child) => !["defs", "style", "title", "desc"].includes(child.tagName.toLowerCase()))
      .map((child) => mermaidTransformBox(child.getAttribute("transform"), child.getBBox())),
  )
  return children.width || children.height
    ? children
    : mermaidBox(0, 0, 100, 20)
}
SVGElement.prototype.getComputedTextLength = function () {
  return this.getBBox().width
}
`

function encodedScriptValue(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64")
}

function dimension(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.ceil(value)
    : 1
}

/** Render Mermaid source to a self-contained SVG in an isolated build-only DOM. */
export async function renderMermaidToSvg(
  source: string,
  { theme = "neutral", signal }: RenderMermaidOptions = {}
): Promise<RenderedMermaidSvg> {
  signal?.throwIfAborted()

  const mermaidSource = await loadMermaidBrowserSource()
  const encodedSource = encodedScriptValue(source)
  const encodedConfig = encodedScriptValue({
    startOnLoad: false,
    securityLevel: "strict",
    theme,
    // Dagre renders entirely through SVG and works in the isolated build DOM.
    layout: "dagre",
    // SVG text works in generated images; JSDOM cannot measure foreignObject labels.
    htmlLabels: false,
  })
  const document = `<!doctype html><body><div id="mermaid-host"></div><script>
    ${svgGeometryPolyfill}
    ${mermaidSource}
    const source = JSON.parse(atob(${JSON.stringify(encodedSource)}))
    const config = JSON.parse(atob(${JSON.stringify(encodedConfig)}))
    mermaid.initialize(config)
    mermaid.render("mermaid-diagram", source)
      .then(({ svg }) => {
        document.getElementById("mermaid-host").innerHTML = svg
        document.body.dataset.mermaidComplete = "true"
      })
      .catch((error) => {
        document.body.dataset.mermaidError = String(error?.stack || error)
      })
  </script></body>`
  const virtualConsole = new VirtualConsole()
  const dom = new JSDOM(document, {
    runScripts: "dangerously",
    virtualConsole,
    beforeParse(window) {
      Object.defineProperties(window, {
        structuredClone: { value: structuredClone },
        TextDecoder: { value: TextDecoder },
        TextEncoder: { value: TextEncoder },
      })
      Object.defineProperties(window.HTMLElement.prototype, {
        offsetHeight: { configurable: true, get: () => 800 },
        offsetWidth: { configurable: true, get: () => 1_200 },
      })
    },
  })

  try {
    const svg = await new Promise<SVGSVGElement>((resolve, reject) => {
      let finished = false
      const timeout = setTimeout(() => {
        finished = true
        reject(new Error("Timed out while rendering the Mermaid diagram"))
      }, 10_000)
      const poll = () => {
        if (finished) return
        if (signal?.aborted) {
          finished = true
          clearTimeout(timeout)
          reject(signal.reason)
          return
        }

        const renderError = dom.window.document.body.dataset.mermaidError
        if (renderError) {
          finished = true
          clearTimeout(timeout)
          reject(
            new Error(`Unable to render the Mermaid diagram: ${renderError}`)
          )
          return
        }

        const rendered = dom.window.document.querySelector("#mermaid-host svg")
        if (rendered) {
          finished = true
          clearTimeout(timeout)
          resolve(rendered as unknown as SVGSVGElement)
          return
        }

        setTimeout(poll, 10)
      }
      poll()
    })
    const viewBox = svg.getAttribute("viewBox")?.trim().split(/\s+/).map(Number)
    const width = dimension(viewBox?.length === 4 ? viewBox[2] : undefined)
    const height = dimension(viewBox?.length === 4 ? viewBox[3] : undefined)

    signal?.throwIfAborted()
    svg.setAttribute("width", String(width))
    svg.setAttribute("height", String(height))
    svg.style.removeProperty("max-width")

    return {
      svg: svg.outerHTML,
      width,
      height,
    }
  } finally {
    dom.window.close()
  }
}
