import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { getDocuments, getRelationDefinitions } from "@the-docs/core"
import { selectGraph, type OntologyProps } from "./graph.js"
import { graphToMermaid } from "./mermaid.js"

// Mermaid owns shared rendering state. Serialize renders across widget instances.
let renderQueue: Promise<unknown> = Promise.resolve()

export function Ontology(props: OntologyProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  const host = useRef<HTMLDivElement>(null)
  const panZoom = useRef<ReturnType<typeof import("svg-pan-zoom")> | null>(null)
  const navigate = useNavigate()
  const [error, setError] = useState<string>()
  const graph = useMemo(
    () => selectGraph(getDocuments(), props),
    [props.subjectFilter, props.extensionFilter, props.extensionMaxHops]
  )
  const diagram = useMemo(
    () =>
      graphToMermaid(
        graph,
        new Map(getRelationDefinitions().map((r) => [r.slug, r.title]))
      ),
    [graph]
  )

  useEffect(() => {
    let cancelled = false
    let observer: ResizeObserver | undefined
    setError(undefined)
    if (!graph.documents.length) return
    const task = renderQueue
      .catch(() => {})
      .then(async () => {
        const { default: mermaid } = await import("mermaid")
        if (cancelled) return
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          themeVariables: {
            primaryColor: "#fff",
            primaryTextColor: "#000",
            lineColor: "#333",
            edgeLabelBackground: "#fff",
          },
          themeCSS:
            ".edgeLabel text, .edgeLabel tspan { font-size: 12px !important; }",
          flowchart: { htmlLabels: false, useMaxWidth: false },
        })
        const { svg } = await mermaid.render(`ontology${id}`, diagram.source)
        if (cancelled || !host.current) return
        host.current.innerHTML = svg
        const element = host.current.querySelector("svg")!
        element.style.width = "100%"
        element.style.height = "100%"
        element.style.maxWidth = "none"
        element.setAttribute("role", "img")
        element.setAttribute("aria-label", "Document ontology graph")
        for (const [slug, nodeId] of diagram.ids) {
          const node = element.querySelector<SVGGElement>(
            `g.node[id^="flowchart-${nodeId}-"]`
          )
          if (!node) continue
          const link = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "a"
          )
          const href = `/p/${encodeURIComponent(slug)}`
          link.setAttribute("href", href)
          link.style.color = "black"
          link.style.textDecoration = "none"
          node.parentNode!.insertBefore(link, node)
          link.appendChild(node)
          link.addEventListener("click", (event) => {
            if (
              event.button !== 0 ||
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey ||
              event.altKey
            )
              return
            event.preventDefault()
            navigate(href)
          })
        }
        // SVG text labels need an explicit opaque backdrop to hide the edge.
        for (const label of element.querySelectorAll<SVGGElement>(
          "g.edgeLabel g.label"
        )) {
          const bounds = label.getBBox()
          const background = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          )
          background.setAttribute("x", String(bounds.x - 5))
          background.setAttribute("y", String(bounds.y - 3))
          background.setAttribute("width", String(bounds.width + 10))
          background.setAttribute("height", String(bounds.height + 6))
          background.style.fill = "white"
          background.style.fillOpacity = "1"
          label.prepend(background)
        }
        for (const [index, edge] of graph.edges.entries()) {
          if (!edge.description) continue
          const label = element.querySelector(
            `g.edgeLabel g.label[data-id="e${index}"]`
          )
          const path = element.querySelector(`path[id="e${index}"]`)
          for (const target of [label, path]) {
            if (!target) continue
            const title = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "title"
            )
            title.textContent = edge.description
            target.prepend(title)
          }
        }
        const { default: svgPanZoom } = await import("svg-pan-zoom")
        if (cancelled) return
        const instance = svgPanZoom(element, {
          zoomEnabled: true,
          controlIconsEnabled: false,
          fit: true,
          center: true,
          minZoom: 0.1,
          maxZoom: 10,
          preventMouseEventsDefault: false,
        })
        panZoom.current = instance
        observer = new ResizeObserver(() => {
          instance.resize()
          instance.fit()
          instance.center()
        })
        observer.observe(host.current)
      })
    renderQueue = task
    task.catch((reason) => {
      if (!cancelled)
        setError(reason instanceof Error ? reason.message : String(reason))
    })
    return () => {
      cancelled = true
      observer?.disconnect()
      panZoom.current?.destroy()
      panZoom.current = null
      host.current?.replaceChildren()
    }
  }, [diagram, graph, id, navigate])

  if (!graph.documents.length)
    return <p role="status">No documents match this ontology filter.</p>
  return (
    <div
      aria-label="Document ontology graph"
      style={{
        position: "relative",
        height: 560,
        width: "100%",
        border: "1px solid #94a3b8",
        borderRadius: 12,
        background: "white",
        color: "black",
        overflow: "hidden",
      }}
    >
      {error ? <p role="alert">Unable to render ontology: {error}</p> : null}
      <div ref={host} style={{ width: "100%", height: "100%" }} />
      <div
        role="group"
        aria-label="Graph controls"
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          display: "flex",
          gap: 4,
        }}
      >
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => panZoom.current?.zoomIn()}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => panZoom.current?.zoomOut()}
        >
          −
        </button>
        <button
          type="button"
          onClick={() => {
            panZoom.current?.fit()
            panZoom.current?.center()
          }}
        >
          Fit
        </button>
      </div>
    </div>
  )
}
