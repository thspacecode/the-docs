import { readFile } from "node:fs/promises"

import { JSDOM, VirtualConsole } from "jsdom"

export interface RenderBpmnOptions {
  padding?: number
  signal?: AbortSignal
}

export interface RenderedBpmnSvg {
  svg: string
  width: number
  height: number
}

let bpmnViewerSource: Promise<string> | undefined

function loadBpmnViewerSource() {
  bpmnViewerSource ??= readFile(
    new URL(import.meta.resolve("bpmn-js/dist/bpmn-viewer.production.min.js")),
    "utf8"
  )
  return bpmnViewerSource
}

/*
 * diagram-js relies on the browser SVG geometry API while importing BPMN.
 * JSDOM does not implement that API, so provide the matrix, transform, point,
 * and bounding-box operations needed by the read-only BPMN viewer.
 */
const svgGeometryPolyfill = String.raw`
class BpmnSvgMatrix {
  constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
    Object.assign(this, { a, b, c, d, e, f })
  }
  multiply(other) {
    return new BpmnSvgMatrix(
      this.a * other.a + this.c * other.b,
      this.b * other.a + this.d * other.b,
      this.a * other.c + this.c * other.d,
      this.b * other.c + this.d * other.d,
      this.a * other.e + this.c * other.f + this.e,
      this.b * other.e + this.d * other.f + this.f,
    )
  }
  translate(x, y = 0) {
    return this.multiply(new BpmnSvgMatrix(1, 0, 0, 1, x, y))
  }
  scale(value) {
    return this.multiply(new BpmnSvgMatrix(value, 0, 0, value, 0, 0))
  }
  inverse() {
    const determinant = this.a * this.d - this.b * this.c
    if (!determinant) return new BpmnSvgMatrix()
    return new BpmnSvgMatrix(
      this.d / determinant,
      -this.b / determinant,
      -this.c / determinant,
      this.a / determinant,
      (this.c * this.f - this.d * this.e) / determinant,
      (this.b * this.e - this.a * this.f) / determinant,
    )
  }
}
class BpmnSvgTransform {
  constructor(matrix = new BpmnSvgMatrix()) { this.matrix = matrix }
  setMatrix(matrix) { this.matrix = matrix }
  setTranslate(x, y) { this.matrix = new BpmnSvgMatrix(1, 0, 0, 1, x, y) }
  setScale(x, y) { this.matrix = new BpmnSvgMatrix(x, 0, 0, y, 0, 0) }
  setRotate(angle, x, y) {
    const radians = angle * Math.PI / 180
    const rotation = new BpmnSvgMatrix(
      Math.cos(radians), Math.sin(radians),
      -Math.sin(radians), Math.cos(radians), 0, 0,
    )
    this.matrix = new BpmnSvgMatrix().translate(x, y)
      .multiply(rotation).translate(-x, -y)
  }
}
window.SVGMatrix = BpmnSvgMatrix
window.SVGTransform = BpmnSvgTransform

const bpmnTransformLists = new WeakMap()
function bpmnMatrixText(matrix) {
  return "matrix(" + [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f].join(" ") + ")"
}
function bpmnTransformList(element) {
  let transforms = bpmnTransformLists.get(element)
  if (transforms) return transforms
  const items = []
  transforms = {
    clear() { items.length = 0; element.removeAttribute("transform") },
    appendItem(item) {
      items.push(item)
      element.setAttribute("transform", bpmnMatrixText(this.consolidate().matrix))
      return item
    },
    createSVGTransformFromMatrix(matrix) { return new BpmnSvgTransform(matrix) },
    consolidate() {
      if (!items.length) return null
      return new BpmnSvgTransform(
        items.reduce((matrix, item) => matrix.multiply(item.matrix), new BpmnSvgMatrix())
      )
    },
  }
  bpmnTransformLists.set(element, transforms)
  return transforms
}
Object.defineProperty(SVGElement.prototype, "transform", {
  configurable: true,
  get() { return { baseVal: bpmnTransformList(this) } },
})
SVGSVGElement.prototype.createSVGMatrix = () => new BpmnSvgMatrix()
SVGSVGElement.prototype.createSVGTransform = () => new BpmnSvgTransform()
SVGSVGElement.prototype.createSVGPoint = () => ({
  x: 0,
  y: 0,
  matrixTransform(matrix) {
    return {
      x: matrix.a * this.x + matrix.c * this.y + matrix.e,
      y: matrix.b * this.x + matrix.d * this.y + matrix.f,
    }
  },
})

function bpmnNumbers(value) {
  return (value || "").match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) || []
}
function bpmnBox(x = 0, y = 0, width = 0, height = 0) {
  return { x, y, width, height }
}
function bpmnUnion(boxes) {
  const valid = boxes.filter((box) => box && Number.isFinite(box.x) && Number.isFinite(box.y))
  if (!valid.length) return bpmnBox()
  const x = Math.min(...valid.map((box) => box.x))
  const y = Math.min(...valid.map((box) => box.y))
  const right = Math.max(...valid.map((box) => box.x + box.width))
  const bottom = Math.max(...valid.map((box) => box.y + box.height))
  return bpmnBox(x, y, right - x, bottom - y)
}
function bpmnAttributeMatrix(value) {
  let matrix = new BpmnSvgMatrix()
  for (const part of (value || "").matchAll(/(matrix|translate|scale|rotate)\s*\(([^)]*)\)/g)) {
    const values = bpmnNumbers(part[2])
    let next = new BpmnSvgMatrix()
    if (part[1] === "matrix") next = new BpmnSvgMatrix(...values.slice(0, 6))
    if (part[1] === "translate") next = next.translate(values[0] || 0, values[1] || 0)
    if (part[1] === "scale") {
      const x = values[0] ?? 1
      const y = values[1] ?? x
      next = new BpmnSvgMatrix(x, 0, 0, y, 0, 0)
    }
    if (part[1] === "rotate") {
      const transform = new BpmnSvgTransform()
      transform.setRotate(values[0] || 0, values[1] || 0, values[2] || 0)
      next = transform.matrix
    }
    matrix = matrix.multiply(next)
  }
  return matrix
}
function bpmnTransformBox(box, matrix) {
  const points = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ].map(([x, y]) => [matrix.a * x + matrix.c * y + matrix.e, matrix.b * x + matrix.d * y + matrix.f])
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  return bpmnBox(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
}
SVGElement.prototype.getBBox = function () {
  const number = (name) => Number(this.getAttribute(name)) || 0
  const tag = this.tagName.toLowerCase()
  let own
  if (tag === "rect" || tag === "image" || tag === "foreignobject") {
    own = bpmnBox(number("x"), number("y"), number("width"), number("height"))
  } else if (tag === "circle") {
    own = bpmnBox(number("cx") - number("r"), number("cy") - number("r"), number("r") * 2, number("r") * 2)
  } else if (tag === "ellipse") {
    own = bpmnBox(number("cx") - number("rx"), number("cy") - number("ry"), number("rx") * 2, number("ry") * 2)
  } else if (tag === "line") {
    own = bpmnUnion([bpmnBox(number("x1"), number("y1")), bpmnBox(number("x2"), number("y2"))])
  } else if (tag === "text" || tag === "tspan") {
    const fontSize = Number.parseFloat(getComputedStyle(this).fontSize) || 12
    own = bpmnBox(number("x"), number("y") - fontSize, Math.max(1, (this.textContent || "").length * fontSize * 0.6), fontSize * 1.2)
  } else if (tag === "path" || tag === "polygon" || tag === "polyline") {
    const values = bpmnNumbers(this.getAttribute(tag === "path" ? "d" : "points"))
    const points = []
    for (let index = 0; index + 1 < values.length; index += 2) {
      points.push(bpmnBox(values[index], values[index + 1]))
    }
    own = bpmnUnion(points)
  }
  const childBoxes = Array.from(this.children)
    .filter((child) => !["defs", "style", "title", "desc"].includes(child.tagName.toLowerCase()))
    .map((child) => bpmnTransformBox(child.getBBox(), bpmnAttributeMatrix(child.getAttribute("transform"))))
    .filter((box) => box.width || box.height)
  const children = childBoxes.length ? bpmnUnion(childBoxes) : undefined
  return bpmnUnion([own, children].filter(Boolean))
}
SVGElement.prototype.getCTM = function () { return bpmnAttributeMatrix(this.getAttribute("transform")) }
SVGElement.prototype.getScreenCTM = SVGElement.prototype.getCTM
`

function encodedScriptValue(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64")
}

function dimension(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : 1
}

/** Render a BPMN 2.0 XML diagram to a self-contained SVG at build time. */
export async function renderBpmnToSvg(
  content: Uint8Array,
  { padding = 24, signal }: RenderBpmnOptions = {}
): Promise<RenderedBpmnSvg> {
  signal?.throwIfAborted()

  let source: string
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(content)
  } catch (error) {
    throw new TypeError("The BPMN asset is not valid UTF-8", { cause: error })
  }

  const viewerSource = await loadBpmnViewerSource()
  const encodedSource = encodedScriptValue(source)
  const safePadding = Number.isFinite(padding) ? Math.max(0, padding) : 24
  const document = `<!doctype html><body><div id="bpmn-host" style="width:1200px;height:800px"></div><script>
    ${svgGeometryPolyfill}
    ${viewerSource}
    const source = JSON.parse(decodeURIComponent(escape(atob(${JSON.stringify(encodedSource)}))))
    const viewer = new BpmnJS({ container: "#bpmn-host" })
    viewer.importXML(source)
      .then(() => viewer.saveSVG())
      .then(({ svg }) => {
        const parsed = new DOMParser().parseFromString(svg, "image/svg+xml")
        const root = parsed.documentElement
        const viewBox = (root.getAttribute("viewBox") || "0 0 1 1").trim().split(/\\s+/).map(Number)
        const extra = ${safePadding} - 5
        const x = viewBox[0] - extra
        const y = viewBox[1] - extra
        const width = Math.max(1, viewBox[2] + extra * 2)
        const height = Math.max(1, viewBox[3] + extra * 2)
        root.setAttribute("viewBox", [x, y, width, height].join(" "))
        root.setAttribute("width", String(Math.ceil(width)))
        root.setAttribute("height", String(Math.ceil(height)))
        document.body.dataset.bpmnSvg = btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(root))))
        document.body.dataset.bpmnWidth = String(width)
        document.body.dataset.bpmnHeight = String(height)
        viewer.destroy()
      })
      .catch((error) => {
        document.body.dataset.bpmnError = String(error?.stack || error)
        viewer.destroy()
      })
  </script></body>`
  const virtualConsole = new VirtualConsole()
  const dom = new JSDOM(document, {
    runScripts: "dangerously",
    virtualConsole,
    beforeParse(window) {
      Object.defineProperty(window, "structuredClone", {
        value: structuredClone,
      })
      Object.defineProperties(window.HTMLElement.prototype, {
        offsetHeight: { configurable: true, get: () => 800 },
        offsetWidth: { configurable: true, get: () => 1_200 },
      })
    },
  })

  try {
    const rendered = await new Promise<RenderedBpmnSvg>((resolve, reject) => {
      let finished = false
      const timeout = setTimeout(() => {
        finished = true
        reject(new Error("Timed out while rendering the BPMN diagram"))
      }, 10_000)
      const poll = () => {
        if (finished) return
        if (signal?.aborted) {
          finished = true
          clearTimeout(timeout)
          reject(signal.reason)
          return
        }

        const renderError = dom.window.document.body.dataset.bpmnError
        if (renderError) {
          finished = true
          clearTimeout(timeout)
          reject(new Error(`Unable to render the BPMN diagram: ${renderError}`))
          return
        }

        const encodedSvg = dom.window.document.body.dataset.bpmnSvg
        if (encodedSvg) {
          finished = true
          clearTimeout(timeout)
          resolve({
            svg: Buffer.from(encodedSvg, "base64").toString("utf8"),
            width: dimension(
              Number(dom.window.document.body.dataset.bpmnWidth)
            ),
            height: dimension(
              Number(dom.window.document.body.dataset.bpmnHeight)
            ),
          })
          return
        }

        setTimeout(poll, 10)
      }
      poll()
    })

    signal?.throwIfAborted()
    return rendered
  } finally {
    dom.window.close()
  }
}
