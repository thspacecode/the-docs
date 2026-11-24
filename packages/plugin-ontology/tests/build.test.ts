import { test } from "node:test"
import assert from "node:assert/strict"
import { ontologyRehypePlugin } from "../src/build/index.ts"

test("registers Ontology only when used, including nested JSX", () => {
  const tree = {
    type: "root",
    children: [
      {
        type: "element",
        children: [{ type: "mdxJsxFlowElement", name: "Ontology" }],
      },
    ],
  }
  ontologyRehypePlugin()(tree)
  assert.equal(tree.children[0].type, "mdxjsEsm")
  ontologyRehypePlugin()(tree)
  assert.equal(tree.children.length, 2)
})
test("does not inject runtime into ordinary documents or code examples", () => {
  const tree = {
    type: "root",
    children: [{ type: "text", value: "<Ontology />" }],
  }
  ontologyRehypePlugin()(tree)
  assert.equal(tree.children.length, 1)
})
test("preserves an explicit component import", () => {
  const tree: Parameters<ReturnType<typeof ontologyRehypePlugin>>[0] = {
    type: "root",
    children: [
      {
        type: "mdxjsEsm",
        data: {
          estree: {
            type: "Program",
            sourceType: "module",
            body: [
              {
                type: "ImportDeclaration",
                attributes: [],
                source: { type: "Literal", value: "custom-component" },
                specifiers: [
                  {
                    type: "ImportSpecifier",
                    imported: { type: "Identifier", name: "Ontology" },
                    local: { type: "Identifier", name: "Ontology" },
                  },
                ],
              },
            ],
          },
        },
      },
      { type: "mdxJsxFlowElement", name: "Ontology" },
    ],
  }
  ontologyRehypePlugin()(tree)
  assert.equal(tree.children!.length, 2)
})
