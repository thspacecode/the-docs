import assert from "node:assert/strict"
import test from "node:test"
import { createElement, useContext } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ExcalidrawPortalContainer } from "../dist/runtime/portal.js"

function Target() {
  const target = useContext(ExcalidrawPortalContainer)
  return createElement("span", null, target?.id ?? "document.body")
}

test(
  "defaults to document.body without host configuration",
  { timeout: 1000 },
  () => {
    assert.equal(
      renderToStaticMarkup(createElement(Target)),
      "<span>document.body</span>"
    )
  }
)

test(
  "keeps portal containers scoped to their host provider",
  { timeout: 1000 },
  () => {
    const host = (id) =>
      createElement(
        ExcalidrawPortalContainer.Provider,
        { value: { id } },
        createElement(Target)
      )
    const markup = renderToStaticMarkup(
      createElement(
        "div",
        null,
        host("first"),
        host("second"),
        createElement(Target)
      )
    )
    assert.equal(
      markup,
      "<div><span>first</span><span>second</span><span>document.body</span></div>"
    )
  }
)
