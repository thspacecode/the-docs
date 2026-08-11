import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"
import type { PluginComponentProps } from "@workspace/plugin-contract"

import type { ExcalidrawModel } from "../types.ts"

import "@excalidraw/excalidraw/index.css"

interface ExcalidrawImageProps extends PluginComponentProps<ExcalidrawModel> {
  alt?: string
}

const ExcalidrawCanvas = lazy(async () => {
  const { Excalidraw } = await import("@excalidraw/excalidraw")
  return { default: Excalidraw }
})

export default function ExcalidrawImage({
  model,
  alt = model.title,
}: ExcalidrawImageProps) {
  const [open, setOpen] = useState(false)
  const [excalidrawApi, setExcalidrawApi] =
    useState<ExcalidrawImperativeAPI | null>(null)
  const initialData = useMemo(() => JSON.parse(model.scene), [model.scene])

  useEffect(() => {
    if (!open || !excalidrawApi) return

    const frame = requestAnimationFrame(() => {
      excalidrawApi.scrollToContent(undefined, {
        fitToViewport: true,
        viewportZoomFactor: 0.9,
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [excalidrawApi, open])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        setExcalidrawApi(null)
      }
    }
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        className="excalidraw-preview"
        aria-label={`Open ${alt || model.title} in Excalidraw`}
        onClick={() => setOpen(true)}
      >
        <img
          src={model.dataUrl}
          alt={alt}
          width={model.width}
          height={model.height}
          loading="lazy"
        />
        <span aria-hidden="true">Open in Excalidraw</span>
      </button>

      {open
        ? createPortal(
            <div
              className="excalidraw-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`${alt || model.title} Excalidraw viewer`}
            >
              <div className="excalidraw-modal-toolbar">
                <p>{alt || model.title}</p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setExcalidrawApi(null)
                  }}
                >
                  Close
                </button>
              </div>
              <div className="excalidraw-modal-canvas">
                <Suspense
                  fallback={
                    <p className="excalidraw-modal-loading">
                      Loading Excalidraw…
                    </p>
                  }
                >
                  <ExcalidrawCanvas
                    excalidrawAPI={setExcalidrawApi}
                    initialData={initialData}
                    viewModeEnabled
                    validateEmbeddable={() => false}
                  />
                </Suspense>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
