import assert from "node:assert/strict"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { build } from "vite"

import { defineConfig } from "../dist/index.js"
import { createViteConfig } from "../dist/vite.js"

async function compile(mdx, plugins) {
  const directory = await mkdtemp(join(tmpdir(), "preset-mdx-"))
  try {
    const entry = join(directory, "index.mdx")
    await writeFile(
      entry,
      "---\ntitle: Example\n---\n\n## Example\n\n<Notice>Hello</Notice>\n\n```js\nconst value = 1\n```\n"
    )
    const config = createViteConfig(
      defineConfig({ contentRoot: directory, mdx, plugins })
    )
    const result = await build({
      configFile: false,
      logLevel: "silent",
      plugins: config.plugins
        .flat(Infinity)
        .filter((plugin) =>
          ["the-docs-content", "@mdx-js/rollup"].includes(plugin?.name)
        ),
      build: {
        ssr: entry,
        write: false,
        minify: false,
        rolldownOptions: {
          external: ["react/jsx-runtime", "custom-mdx-provider"],
        },
      },
    })
    return result.output.map((chunk) => chunk.code ?? "").join("\n")
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

test(
  "forwards provider and compiler plugins without removing defaults",
  { timeout: 60000 },
  async () => {
    function remarkMarker() {
      return (tree) => {
        tree.children.push({
          type: "paragraph",
          children: [{ type: "text", value: "remark-marker" }],
        })
      }
    }
    function rehypeMarker() {
      return (tree) => {
        tree.children.push({
          type: "element",
          tagName: "span",
          properties: { id: "rehype-marker" },
          children: [],
        })
      }
    }
    const code = await compile({
      providerImportSource: "custom-mdx-provider",
      remarkPlugins: [remarkMarker],
      rehypePlugins: [rehypeMarker],
    })
    assert.match(code, /custom-mdx-provider/)
    assert.match(code, /remark-marker/)
    assert.match(code, /rehype-marker/)
    assert.match(code, /id: "example"/)
    assert.match(code, /shiki/)
  }
)

test(
  "keeps existing defaults when mdx is omitted",
  { timeout: 60000 },
  async () => {
    const code = await compile()
    assert.doesNotMatch(code, /custom-mdx-provider/)
    assert.match(code, /shiki/)
  }
)

test(
  "keeps plugin disable options with custom MDX options",
  { timeout: 60000 },
  async () => {
    const code = await compile(
      { providerImportSource: "custom-mdx-provider" },
      { syntaxHighlighter: false }
    )
    assert.match(code, /custom-mdx-provider/)
    assert.doesNotMatch(code, /shiki/)
  }
)
