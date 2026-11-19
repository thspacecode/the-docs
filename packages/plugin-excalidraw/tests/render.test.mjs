import assert from "node:assert/strict"
import test from "node:test"
import { renderExcalidrawToSvg } from "../dist/build/render.js"

test(
  "keeps Unicode scene labels in build previews",
  { timeout: 15000 },
  async () => {
    const label = "สวัสดี — café"
    const scene = {
      type: "excalidraw",
      elements: [
        {
          id: "label",
          type: "text",
          x: 0,
          y: 0,
          width: 200,
          height: 25,
          angle: 0,
          strokeColor: "#000000",
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1,
          strokeStyle: "solid",
          roughness: 0,
          opacity: 100,
          groupIds: [],
          frameId: null,
          roundness: null,
          seed: 1,
          version: 1,
          versionNonce: 1,
          isDeleted: false,
          boundElements: null,
          updated: 1,
          link: null,
          locked: false,
          text: label,
          originalText: label,
          fontSize: 20,
          fontFamily: 2,
          textAlign: "left",
          verticalAlign: "top",
          containerId: null,
          autoResize: true,
          lineHeight: 1.25,
        },
      ],
      appState: {},
      files: {},
    }
    const image = await renderExcalidrawToSvg(
      Buffer.from(JSON.stringify(scene))
    )
    assert.ok(image.svg.includes(label))
    assert.ok(image.width > 0 && image.height > 0)
  }
)
