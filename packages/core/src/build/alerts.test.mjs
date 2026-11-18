import assert from "node:assert/strict"
import test from "node:test"
import { rehypeAlerts } from "../../dist/build/alerts.js"

function quote(value, extra = []) {
  return {
    type: "element",
    tagName: "blockquote",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "p",
        properties: {},
        children: [{ type: "text", value }, ...extra],
      },
    ],
  }
}

for (const kind of ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"]) {
  test(`transforms ${kind} and preserves content`, () => {
    const node = quote(`[!${kind}]\nContent`)
    rehypeAlerts()({ type: "root", children: [node] })
    assert.equal(node.properties["data-alert"], kind.toLowerCase())
    assert.equal(node.children[0].children[0].value, "Content")
  })
}

test("preserves normal and unknown blockquotes", () => {
  for (const text of [
    "Normal quote",
    "[!OTHER]\nContent",
    "[!NOTE] inline text",
  ]) {
    const node = quote(text)
    const original = structuredClone(node)
    rehypeAlerts()({ type: "root", children: [node] })
    assert.deepEqual(node, original)
  }
})

test("removes marker paragraph and hard break without losing rich content", () => {
  const node = quote("[!NOTE]", [
    { type: "element", tagName: "br", properties: {}, children: [] },
  ])
  const body = {
    type: "element",
    tagName: "p",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "strong",
        properties: {},
        children: [{ type: "text", value: "Body" }],
      },
    ],
  }
  node.children.push(body)
  rehypeAlerts()({ type: "root", children: [node] })
  assert.deepEqual(node.children, [body])
})

test("handles nested alerts", () => {
  const nested = quote("[!TIP]\nNested")
  const parent = quote("Outer")
  parent.children.push(nested)
  rehypeAlerts()({ type: "root", children: [parent] })
  assert.equal(nested.properties["data-alert"], "tip")
  assert.equal(parent.properties["data-alert"], undefined)
})
