import { test } from "node:test"
import assert from "node:assert/strict"
import { JSDOM } from "jsdom"
import { graphToMermaid, mermaidText } from "../src/mermaid.ts"
import { selectGraph, type GraphDocument } from "../src/graph.ts"

test("generates named parallel edges and all four endpoint combinations", async () => {
  const docs: GraphDocument[] = [
    {
      slug: "a",
      frontmatter: {
        title: 'A [test] "quote" <script>',
        tags: [],
        relations: [
          {
            relatedDoc: "b",
            relationSlug: "test",
            subjectEnd: "none",
            relatedEnd: "none",
          },
          {
            relatedDoc: "b",
            relationSlug: "test",
            subjectEnd: "none",
            relatedEnd: "arrow",
          },
          {
            relatedDoc: "b",
            relationSlug: "test",
            subjectEnd: "arrow",
            relatedEnd: "none",
          },
          {
            relatedDoc: "b",
            relationSlug: "test",
            subjectEnd: "arrow",
            relatedEnd: "arrow",
          },
        ],
      },
    },
    { slug: "b", frontmatter: { title: "B", tags: [] } },
  ]
  const { source, ids } = graphToMermaid(
    selectGraph(docs, { subjectFilter: { slugs: ["a"] }, extensionMaxHops: 1 }),
    new Map([["test", 'Label | "hi"']])
  )
  assert.equal(ids.get("a"), "n0")
  assert.match(source, /n0\[.*:::subject/)
  assert.match(source, /n1\[.*:::document/)
  assert.match(source, /e0@---/)
  assert.match(source, /e1@-->/)
  assert.match(source, /n1 e2@-->/)
  assert.match(source, /e3@<-->/)
  assert.ok(!source.includes("<script>"))
  const dom = new JSDOM("", { runScripts: "outside-only" })
  try {
    globalThis.window = dom.window
    globalThis.document = dom.window.document
    const { default: mermaid } = await import("mermaid")
    assert.ok(await mermaid.parse(source))
  } finally {
    dom.window.close()
    delete globalThis.window
    delete globalThis.document
  }
})

test("metadata cannot insert directives, newlines, or raw HTML", () => {
  const encoded = mermaidText('"\n%%{init: {}}%%<img src=x>#quot;')
  assert.ok(!encoded.includes("\n"))
  assert.ok(!encoded.includes("<img"))
  assert.ok(!encoded.includes("%%"))
  assert.ok(!encoded.includes('"'))
})
