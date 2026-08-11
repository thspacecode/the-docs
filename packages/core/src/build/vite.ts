import { readFileSync } from "node:fs"
import { basename, dirname, resolve } from "node:path"

import mdx from "@mdx-js/rollup"
import type { Options as MdxOptions } from "@mdx-js/rollup"
import matter from "gray-matter"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import type { Plugin, PluginOption } from "vite"

import { discoverDocuments } from "./discovery.ts"

const virtualModuleId = "virtual:docs-content"
const resolvedVirtualModuleId = `\0${virtualModuleId}`

export interface DocsViteOptions {
  contentRoot: string
  /** Additional MDX compiler options, such as plugin-provided rehype plugins. */
  mdx?: MdxOptions
}

function createContentModule(contentRoot: string) {
  const documents = discoverDocuments(contentRoot)
  const imports = documents.map(
    ({ filePath }, index) =>
      `import Document${index} from ${JSON.stringify(filePath)}`
  )
  const entries = documents.map(({ filePath, slug }, index) => {
    const { data } = matter(readFileSync(filePath, "utf8"))

    return `{ slug: ${JSON.stringify(slug)}, Component: Document${index}, frontmatter: ${JSON.stringify(data)} }`
  })

  return `${imports.join("\n")}\nexport const documents = [${entries.join(",\n")}];\n`
}

function isDocumentFile(filePath: string, contentRoot: string) {
  return (
    basename(filePath) === "index.mdx" &&
    resolve(dirname(dirname(filePath))) === contentRoot
  )
}

function docsContentPlugin(contentRoot: string): Plugin {
  return {
    name: "workspace-docs-content",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return createContentModule(contentRoot)
      }
    },
    configureServer(server) {
      server.watcher.add(contentRoot)
    },
    handleHotUpdate(context) {
      if (!isDocumentFile(context.file, contentRoot)) {
        return
      }

      const virtualModule = context.server.moduleGraph.getModuleById(
        resolvedVirtualModuleId
      )

      if (!virtualModule) {
        return
      }

      context.server.moduleGraph.invalidateModule(virtualModule)
      return [virtualModule, ...context.modules]
    },
  }
}

export function createDocsVitePlugins({
  contentRoot,
  mdx: mdxOptions = {},
}: DocsViteOptions): PluginOption[] {
  const resolvedContentRoot = resolve(contentRoot)

  return [
    docsContentPlugin(resolvedContentRoot),
    mdx({
      ...mdxOptions,
      remarkPlugins: [
        remarkFrontmatter,
        remarkGfm,
        ...(mdxOptions.remarkPlugins ?? []),
      ],
    }),
  ]
}
