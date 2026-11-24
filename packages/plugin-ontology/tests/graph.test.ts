import { test } from "node:test"
import assert from "node:assert/strict"
import { selectGraph, matchesFilter, type GraphDocument } from "../src/graph.ts"
import { validateRelations } from "../../core/src/content/relations.ts"

const relation = (relatedDoc: string, description = "") => ({
  relatedDoc,
  relationSlug: "create",
  subjectEnd: "none" as const,
  relatedEnd: "arrow" as const,
  description,
})
const docs: GraphDocument[] = [
  {
    slug: "a",
    frontmatter: {
      title: "A",
      type: "doctype",
      tags: ["x"],
      relations: [relation("b"), relation("b", "parallel")],
    },
  },
  {
    slug: "b",
    frontmatter: {
      title: "B",
      type: "workflow",
      tags: [],
      relations: [relation("c")],
    },
  },
  {
    slug: "c",
    frontmatter: {
      title: "C",
      type: "doctype",
      tags: ["x", "y"],
      relations: [relation("a")],
    },
  },
]
test("zero hops shows subjects and all edges between them", () => {
  const graph = selectGraph(docs, { subjectFilter: { slugs: ["a", "b"] } })
  assert.deepEqual(
    graph.documents.map((d) => d.slug),
    ["a", "b"]
  )
  assert.equal(graph.edges.length, 2)
})
test("incoming edges expand, cycles terminate, parallel edges survive", () => {
  const graph = selectGraph(docs, {
    subjectFilter: { slugs: ["c"] },
    extensionMaxHops: 10,
  })
  assert.equal(graph.documents.length, 3)
  assert.equal(graph.edges.length, 4)
})
test("failed extension blocks traversal", () => {
  const chain = docs.map((d) =>
    d.slug === "c"
      ? { ...d, frontmatter: { ...d.frontmatter, relations: [] } }
      : d
  )
  assert.deepEqual(
    selectGraph(chain, {
      subjectFilter: { slugs: ["a"] },
      extensionMaxHops: 2,
      extensionFilter: { documentType: "doctype" },
    }).documents.map((d) => d.slug),
    ["a"]
  )
})
test("alternative valid path still reaches a node", () => {
  assert.deepEqual(
    selectGraph(docs, {
      subjectFilter: { slugs: ["a"] },
      extensionMaxHops: 2,
      extensionFilter: { documentType: "doctype" },
    }).documents.map((d) => d.slug),
    ["a", "c"]
  )
})
test("nested filters combine fields with AND", () => {
  assert.ok(
    matchesFilter(docs[2], {
      documentType: ["doctype"],
      and: [{ tags: { all: ["x", "y"] } }],
      or: [{ slugs: ["c"] }, { slugs: ["missing"] }],
    })
  )
  assert.ok(!matchesFilter(docs[0], { tags: { all: ["x", "y"] } }))
  assert.ok(matchesFilter(docs[0], {}))
})
test("empty results and invalid hop limits", () => {
  assert.equal(
    selectGraph(docs, { subjectFilter: { slugs: [] } }).documents.length,
    0
  )
  for (const hops of [-1, 0.5, Infinity])
    assert.throws(() =>
      selectGraph(docs, { subjectFilter: {}, extensionMaxHops: hops })
    )
})
test("validation rejects bad references, endpoints, self-links and duplicates", () => {
  const validate = (value: unknown) =>
    validateRelations(
      value,
      "a",
      new Set(["a", "b"]),
      new Set(["create"]),
      "a/index.mdx"
    )
  validate([relation("b"), relation("b", "other")])
  for (const value of [
    {},
    [relation("a")],
    [relation("missing")],
    [{ ...relation("b"), relationSlug: "missing" }],
    [{ ...relation("b"), relatedEnd: "diamond" }],
    [relation("b"), relation("b")],
  ])
    assert.throws(() => validate(value), /a\/index.mdx/)
})
