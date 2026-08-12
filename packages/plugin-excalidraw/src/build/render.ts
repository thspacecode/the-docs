import { readFile } from "node:fs/promises"

import { JSDOM } from "jsdom"

interface ExcalidrawScene {
  type: "excalidraw"
  elements: unknown[]
  appState?: Record<string, unknown>
  files?: Record<string, unknown>
}

export interface RenderExcalidrawOptions {
  padding?: number
  signal?: AbortSignal
}

export interface RenderedExcalidrawSvg {
  svg: string
  width: number
  height: number
}

function parseScene(content: Uint8Array): ExcalidrawScene {
  let value: unknown

  try {
    value = JSON.parse(new TextDecoder().decode(content))
  } catch (error) {
    throw new TypeError("The Excalidraw asset is not valid JSON", { cause: error })
  }

  if (
    !value ||
    typeof value !== "object" ||
    (value as { type?: unknown }).type !== "excalidraw" ||
    !Array.isArray((value as { elements?: unknown }).elements)
  ) {
    throw new TypeError("The asset is not a valid Excalidraw scene")
  }

  return value as ExcalidrawScene
}

function dimension(value: string | null, fallback: number) {
  const parsed = value ? Number.parseFloat(value) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/** Render an Excalidraw scene with Excalidraw's exporter in a build-only DOM. */
export async function renderExcalidrawToSvg(
  content: Uint8Array,
  { padding = 16, signal }: RenderExcalidrawOptions = {}
): Promise<RenderedExcalidrawSvg> {
  signal?.throwIfAborted()

  const scene = parseScene(content)
  const [utilsSource, path2dSource] = await Promise.all([
    readFile(new URL(import.meta.resolve("@excalidraw/utils")), "utf8"),
    readFile(new URL(import.meta.resolve("canvas-5-polyfill")), "utf8"),
  ])
  const encodedScene = Buffer.from(JSON.stringify(scene)).toString("base64")
  const safePadding = Number.isFinite(padding) ? Math.max(0, padding) : 16
  const document = `<!doctype html><body><script>
    class CanvasRenderingContext2D {
      constructor() { this.filter = "none"; this.font = "20px sans-serif" }
      measureText(text) { return { width: String(text).length * 10 } }
      save() {}
      restore() {}
      beginPath() {}
      closePath() {}
      moveTo() {}
      lineTo() {}
      bezierCurveTo() {}
      quadraticCurveTo() {}
      arc() {}
      rect() {}
      fill() {}
      stroke() {}
      clip() {}
      translate() {}
      rotate() {}
      scale() {}
      setTransform() {}
      clearRect() {}
      fillRect() {}
      strokeRect() {}
      drawImage() {}
      getImageData() {
        return { data: new Uint8ClampedArray(4), width: 1, height: 1 }
      }
      createImageData() {
        return { data: new Uint8ClampedArray(4), width: 1, height: 1 }
      }
      putImageData() {}
      fillText() {}
      strokeText() {}
      setLineDash() {}
    }
    HTMLCanvasElement.prototype.getContext = function () {
      return new CanvasRenderingContext2D()
    };
    ${path2dSource}
    ;
    ${utilsSource}
    ;
    const scene = JSON.parse(atob(${JSON.stringify(encodedScene)}))
    Promise.resolve()
      .then(() => ExcalidrawUtils.exportToSvg({
        elements: scene.elements,
        appState: {
          ...(scene.appState || {}),
          exportPadding: ${safePadding},
        },
        files: scene.files || {},
      }))
      .then((svg) => document.body.appendChild(svg))
      .catch((error) => {
        document.body.dataset.excalidrawError = String(error)
      })
  </script></body>`
  const dom = new JSDOM(document, { runScripts: "dangerously" })

  try {
    const svg = await new Promise<SVGSVGElement>((resolve, reject) => {
      let finished = false
      const timeout = setTimeout(() => {
        finished = true
        reject(new Error("Timed out while rendering the Excalidraw asset"))
      }, 10_000)
      const poll = () => {
        if (finished) return
        if (signal?.aborted) {
          finished = true
          clearTimeout(timeout)
          reject(signal.reason)
          return
        }

        const renderError =
          dom.window.document.body.dataset.excalidrawError
        if (renderError) {
          finished = true
          clearTimeout(timeout)
          reject(new Error(`Unable to render the Excalidraw asset: ${renderError}`))
          return
        }

        const rendered = dom.window.document.querySelector("svg")
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
    const fallbackWidth = viewBox?.length === 4 ? viewBox[2] : 1
    const fallbackHeight = viewBox?.length === 4 ? viewBox[3] : 1

    signal?.throwIfAborted()

    return {
      svg: svg.outerHTML,
      width: Math.ceil(dimension(svg.getAttribute("width"), fallbackWidth ?? 1)),
      height: Math.ceil(
        dimension(svg.getAttribute("height"), fallbackHeight ?? 1)
      ),
    }
  } finally {
    dom.window.close()
  }
}
