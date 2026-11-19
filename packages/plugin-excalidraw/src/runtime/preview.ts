import { useEffect, useState } from "react"

export function useExcalidrawPreview(model: {
  padding?: number
  scene: string
  dataUrl: string
}) {
  const [preview, setPreview] = useState<{ scene: string; url: string } | null>(
    null
  )
  useEffect(() => {
    let active = true
    let url: string | undefined
    async function render() {
      const { exportToSvg } = await import("@excalidraw/excalidraw")
      const scene = JSON.parse(model.scene)
      const svg = await exportToSvg({
        elements: scene.elements,
        appState: { ...scene.appState, exportPadding: model.padding ?? 16 },
        files: scene.files || {},
      })
      if (!active) return
      url = URL.createObjectURL(
        new Blob([svg.outerHTML], { type: "image/svg+xml" })
      )
      setPreview({ scene: model.scene, url })
    }
    // Keep the build preview if the browser cannot load the exporter.
    void render().catch(() => {})
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [model.scene, model.dataUrl, model.padding])
  return preview?.scene === model.scene ? preview.url : model.dataUrl
}
