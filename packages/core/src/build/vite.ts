import { readFileSync, statSync } from "node:fs"
import { basename, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import mdx from "@mdx-js/rollup"
import type { Options as MdxOptions } from "@mdx-js/rollup"
import matter from "gray-matter"
import dynamicIconImports from "lucide-react/dynamicIconImports.mjs"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import type { Plugin, PluginOption } from "vite"

import {
  extractTableOfContents,
  rehypeTableOfContentsHeadings,
} from "../content/table-of-contents.js"
import {
  discoverDocuments,
  discoverScopes,
  discoverTags,
  discoverTypes,
} from "./discovery.js"

const virtualModuleId = "virtual:docs-content"
const resolvedVirtualModuleId = `\0${virtualModuleId}`
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const validIconNames = new Set<string>(Object.keys(dynamicIconImports))

export interface DocsViteOptions {
  contentRoot: string
  /** Additional MDX compiler options, such as plugin-provided rehype plugins. */
  mdx?: MdxOptions
}

function scopeValidationError(
  filePath: string,
  path: string,
  message: string
): never {
  throw new Error(`${filePath}: ${path} ${message}`)
}

function objectDefinition(
  value: unknown,
  filePath: string,
  path: string
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    scopeValidationError(filePath, path, "must be an object")
  }

  return value as Record<string, unknown>
}

function requiredString(
  value: unknown,
  filePath: string,
  path: string
): string {
  if (typeof value !== "string" || !value.trim()) {
    scopeValidationError(filePath, path, "must be a non-empty string")
  }

  return value.trim()
}

function validateOptionalString(
  value: unknown,
  filePath: string,
  path: string
) {
  if (value !== undefined && (typeof value !== "string" || !value.trim())) {
    scopeValidationError(filePath, path, "must be a non-empty string")
  }
}

function validateIcon(value: unknown, filePath: string, path: string) {
  if (value === undefined) return

  const name = requiredString(value, filePath, path)
  if (!validIconNames.has(name)) {
    scopeValidationError(
      filePath,
      path,
      `references unknown Lucide icon ${JSON.stringify(name)}`
    )
  }
}

function validateDocumentReference(
  value: unknown,
  filePath: string,
  path: string,
  documentSlugs: Set<string>,
  referencedDocuments: Set<string>
) {
  const reference = objectDefinition(value, filePath, path)
  const slug = requiredString(reference.slug, filePath, `${path}.slug`)

  if (!documentSlugs.has(slug)) {
    scopeValidationError(
      filePath,
      `${path}.slug`,
      `references unknown document ${JSON.stringify(slug)}`
    )
  }
  if (referencedDocuments.has(slug)) {
    scopeValidationError(
      filePath,
      `${path}.slug`,
      `duplicates document ${JSON.stringify(slug)} in this scope`
    )
  }

  referencedDocuments.add(slug)
  validateIcon(reference.icon, filePath, `${path}.icon`)
}

function validateDocumentReferences(
  value: unknown,
  filePath: string,
  path: string,
  documentSlugs: Set<string>,
  referencedDocuments: Set<string>
) {
  if (value === undefined) return
  if (!Array.isArray(value)) {
    scopeValidationError(filePath, path, "must be an array")
  }

  value.forEach((reference, index) =>
    validateDocumentReference(
      reference,
      filePath,
      `${path}[${index}]`,
      documentSlugs,
      referencedDocuments
    )
  )
}

function validateScopeDefinition(
  value: unknown,
  filePath: string,
  documentSlugs: Set<string>
) {
  const definition = objectDefinition(value, filePath, "scope")
  requiredString(definition.title, filePath, "scope.title")
  validateOptionalString(definition.description, filePath, "scope.description")
  validateIcon(definition.icon, filePath, "scope.icon")

  if (!Array.isArray(definition.sections)) {
    scopeValidationError(filePath, "scope.sections", "must be an array")
  }

  const sectionIds = new Set<string>()
  const referencedDocuments = new Set<string>()

  definition.sections.forEach((sectionValue, sectionIndex) => {
    const sectionPath = `scope.sections[${sectionIndex}]`
    const section = objectDefinition(sectionValue, filePath, sectionPath)
    const sectionId = requiredString(section.id, filePath, `${sectionPath}.id`)

    if (!idPattern.test(sectionId)) {
      scopeValidationError(
        filePath,
        `${sectionPath}.id`,
        "must use lowercase letters, numbers, and hyphens"
      )
    }
    if (sectionIds.has(sectionId)) {
      scopeValidationError(
        filePath,
        `${sectionPath}.id`,
        `duplicates section id ${JSON.stringify(sectionId)}`
      )
    }
    sectionIds.add(sectionId)

    requiredString(section.title, filePath, `${sectionPath}.title`)
    validateOptionalString(
      section.description,
      filePath,
      `${sectionPath}.description`
    )
    validateIcon(section.icon, filePath, `${sectionPath}.icon`)
    validateDocumentReferences(
      section.documents,
      filePath,
      `${sectionPath}.documents`,
      documentSlugs,
      referencedDocuments
    )

    if (section.groups !== undefined && !Array.isArray(section.groups)) {
      scopeValidationError(
        filePath,
        `${sectionPath}.groups`,
        "must be an array"
      )
    }

    const groupIds = new Set<string>()
    ;(section.groups ?? []).forEach((groupValue, groupIndex) => {
      const groupPath = `${sectionPath}.groups[${groupIndex}]`
      const group = objectDefinition(groupValue, filePath, groupPath)
      const groupId = requiredString(group.id, filePath, `${groupPath}.id`)

      if (!idPattern.test(groupId)) {
        scopeValidationError(
          filePath,
          `${groupPath}.id`,
          "must use lowercase letters, numbers, and hyphens"
        )
      }
      if (groupIds.has(groupId)) {
        scopeValidationError(
          filePath,
          `${groupPath}.id`,
          `duplicates group id ${JSON.stringify(groupId)}`
        )
      }
      groupIds.add(groupId)

      validateOptionalString(group.title, filePath, `${groupPath}.title`)
      validateOptionalString(
        group.description,
        filePath,
        `${groupPath}.description`
      )
      validateIcon(group.icon, filePath, `${groupPath}.icon`)

      if (group.title === undefined && group.document === undefined) {
        scopeValidationError(
          filePath,
          groupPath,
          "must provide either title or document"
        )
      }
      if (group.document !== undefined) {
        validateDocumentReference(
          group.document,
          filePath,
          `${groupPath}.document`,
          documentSlugs,
          referencedDocuments
        )
      }
      validateDocumentReferences(
        group.documents,
        filePath,
        `${groupPath}.documents`,
        documentSlugs,
        referencedDocuments
      )
    })
  })
}

function collectIconNames(value: unknown, names: Set<string>) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectIconNames(entry, names))
    return
  }
  if (value === null || typeof value !== "object") return

  for (const [key, entry] of Object.entries(value)) {
    if (key === "icon" && typeof entry === "string") names.add(entry)
    else collectIconNames(entry, names)
  }
}

function iconModuleSpecifier(name: string) {
  const importer = dynamicIconImports[name as keyof typeof dynamicIconImports]
  const modulePath = importer
    ?.toString()
    .match(/["']\.\/icons\/([^"']+\.mjs)["']/)?.[1]

  if (!modulePath) {
    throw new Error(`Unable to resolve Lucide icon module for ${name}`)
  }

  return fileURLToPath(
    new URL(
      `./dist/esm/icons/${modulePath}`,
      import.meta.resolve("lucide-react/dynamicIconImports.mjs")
    )
  )
}

function readJson(filePath: string) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as unknown
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${filePath}: unable to parse JSON: ${message}`)
  }
}

function createContentModule(contentRoot: string) {
  const documents = discoverDocuments(contentRoot)
  const documentSlugs = new Set(documents.map(({ slug }) => slug))
  const documentSources = documents.map(({ filePath, slug }) => {
    const { content, data } = matter(readFileSync(filePath, "utf8"))
    const relatedDocs = data["related-docs"]

    if (relatedDocs !== undefined) {
      if (
        !Array.isArray(relatedDocs) ||
        relatedDocs.some((relatedSlug) => typeof relatedSlug !== "string")
      ) {
        throw new Error(
          `${filePath}: frontmatter related-docs must be an array of document slugs`
        )
      }

      for (const relatedSlug of relatedDocs) {
        if (!documentSlugs.has(relatedSlug)) {
          throw new Error(
            `${filePath}: frontmatter related-docs references unknown document ${JSON.stringify(relatedSlug)}`
          )
        }
        if (relatedSlug === slug) {
          throw new Error(
            `${filePath}: frontmatter related-docs cannot reference its own document`
          )
        }
      }
    }

    return {
      content,
      data,
      modifiedAt: statSync(filePath).mtimeMs,
    }
  })
  const imports = documents.map(
    ({ filePath }, index) =>
      `import Document${index} from ${JSON.stringify(filePath)}`
  )
  const entries = documents.map(({ slug }, index) => {
    const { content, data, modifiedAt } = documentSources[index]

    return `{ slug: ${JSON.stringify(slug)}, Component: Document${index}, frontmatter: ${JSON.stringify(data)}, modifiedAt: ${JSON.stringify(modifiedAt)}, searchText: ${JSON.stringify(content)}, tableOfContents: ${JSON.stringify(extractTableOfContents(content))} }`
  })
  const usedIconNames = new Set<string>()
  const scopes = discoverScopes(contentRoot).map(({ filePath, slug }) => {
    const definition = readJson(filePath)
    validateScopeDefinition(definition, filePath, documentSlugs)
    collectIconNames(definition, usedIconNames)
    return `{ slug: ${JSON.stringify(slug)}, definition: ${JSON.stringify(definition)} }`
  })
  const scopeIconImports = [...usedIconNames].map(
    (name, index) =>
      `import ScopeIcon${index} from ${JSON.stringify(iconModuleSpecifier(name))}`
  )
  const scopeIconEntries = [...usedIconNames].map(
    (name, index) => `${JSON.stringify(name)}: ScopeIcon${index}`
  )
  const tags = discoverTags(contentRoot).map(
    ({ filePath, parentSlug, slug }) =>
      `{ slug: ${JSON.stringify(slug)}, parentSlug: ${JSON.stringify(parentSlug)}, definition: ${JSON.stringify(readJson(filePath))} }`
  )
  const types = discoverTypes(contentRoot).map(
    ({ filePath, slug }) =>
      `{ slug: ${JSON.stringify(slug)}, definition: ${JSON.stringify(readJson(filePath))} }`
  )

  return `${[...imports, ...scopeIconImports].join("\n")}\nexport const documents = [${entries.join(",\n")}];\nexport const scopes = [${scopes.join(",\n")}];\nexport const scopeIcons = {${scopeIconEntries.join(",\n")}};\nexport const tags = [${tags.join(",\n")}];\nexport const types = [${types.join(",\n")}];\n`
}

function isContentFile(filePath: string, contentRoot: string) {
  const isDocument =
    basename(filePath) === "index.mdx" &&
    resolve(dirname(dirname(filePath))) === contentRoot
  const isTag =
    basename(filePath) === "tag.json" &&
    resolve(filePath).startsWith(resolve(contentRoot, "_tags") + "/")
  const isScope =
    basename(filePath) === "scope.json" &&
    resolve(filePath).startsWith(resolve(contentRoot, "_scopes") + "/")
  const isType =
    basename(filePath) === "type.json" &&
    resolve(filePath).startsWith(resolve(contentRoot, "_types") + "/")

  return isDocument || isTag || isScope || isType
}

function docsContentPlugin(contentRoot: string): Plugin {
  return {
    name: "the-docs-content",
    enforce: "pre",
    resolveId: {
      filter: { id: new RegExp(`^${virtualModuleId}$`) },
      handler(id) {
        if (id === virtualModuleId) {
          return resolvedVirtualModuleId
        }
      },
    },
    load: {
      filter: { id: new RegExp(`^${resolvedVirtualModuleId}$`) },
      handler(id) {
        if (id === resolvedVirtualModuleId) {
          return createContentModule(contentRoot)
        }
      },
    },
    configureServer(server) {
      server.watcher.add(contentRoot)
    },
    handleHotUpdate(context) {
      if (!isContentFile(context.file, contentRoot)) {
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
      rehypePlugins: [
        rehypeTableOfContentsHeadings,
        ...(mdxOptions.rehypePlugins ?? []),
      ],
    }),
  ]
}
