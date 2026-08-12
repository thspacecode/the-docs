import Fuse from "fuse.js"

import type { DocumentEntry } from "../content/types.js"

const qualifierNames = ["tag", "type", "scope", "importance"] as const

export type SearchQualifier = (typeof qualifierNames)[number]

export interface ParsedSearchQuery {
  text: string
  qualifiers: Record<SearchQualifier, string[]>
}

interface SearchRecord {
  document: DocumentEntry
  title: string
  description: string
  content: string
  tags: string[]
  type: string
  scopes: string[]
  importance: string
}

const qualifierPattern =
  /(?:^|\s)(tag|type|scope|importance):(?:"([^"]+)"|(\S+))/gi

function normalize(value: string) {
  return value.trim().toLocaleLowerCase()
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const qualifiers: ParsedSearchQuery["qualifiers"] = {
    tag: [],
    type: [],
    scope: [],
    importance: [],
  }

  const text = query.replace(
    qualifierPattern,
    (_match, name: SearchQualifier, quotedValue?: string, value?: string) => {
      const qualifierValue = normalize(quotedValue ?? value ?? "")

      if (qualifierValue) {
        qualifiers[name.toLocaleLowerCase() as SearchQualifier].push(
          qualifierValue
        )
      }

      return " "
    }
  )

  return {
    text: text.replace(/\s+/g, " ").trim(),
    qualifiers,
  }
}

function matchesQualifiers(
  record: SearchRecord,
  qualifiers: ParsedSearchQuery["qualifiers"]
) {
  const tags = record.tags.map(normalize)

  const matchesAny = (values: string[], recordValue: string) =>
    !values.length || values.includes(normalize(recordValue))
  const matchesTag = (tag: string) =>
    tags.some(
      (documentTag) => documentTag === tag || documentTag.startsWith(`${tag}/`)
    )
  const normalizedScopes = record.scopes.map(normalize)

  return (
    qualifiers.tag.every(matchesTag) &&
    matchesAny(qualifiers.type, record.type) &&
    (!qualifiers.scope.length ||
      qualifiers.scope.some((scope) => normalizedScopes.includes(scope))) &&
    matchesAny(qualifiers.importance, record.importance)
  )
}

export class DocumentSearchIndex {
  private readonly records: SearchRecord[]
  private readonly fuse: Fuse<SearchRecord>

  constructor(documents: DocumentEntry[]) {
    this.records = documents.map((document) => ({
      document,
      title: document.frontmatter.title,
      description: document.frontmatter.description ?? "",
      content: document.searchText,
      tags: document.frontmatter.tags,
      type: document.frontmatter.type ?? "",
      scopes: document.scopeSlugs,
      importance: document.frontmatter.importance ?? "",
    }))

    this.fuse = new Fuse(this.records, {
      includeMatches: true,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 1,
      shouldSort: true,
      threshold: 0.35,
      keys: [
        { name: "title", weight: 0.4 },
        { name: "description", weight: 0.25 },
        { name: "tags", weight: 0.15 },
        { name: "content", weight: 0.1 },
        { name: "type", weight: 0.04 },
        { name: "scopes", weight: 0.04 },
        { name: "importance", weight: 0.02 },
      ],
    })
  }

  search(query: string): DocumentEntry[] {
    const { text, qualifiers } = parseSearchQuery(query)
    const rankedRecords = text
      ? this.fuse.search(text).map(({ item }) => item)
      : this.records

    return rankedRecords
      .filter((record) => matchesQualifiers(record, qualifiers))
      .map(({ document }) => document)
  }
}

export function setSearchQualifiers(
  query: string,
  qualifier: SearchQualifier,
  values: string[]
) {
  const pattern = new RegExp(`(?:^|\\s)${qualifier}:(?:"[^"]+"|\\S+)`, "gi")
  const text = query.replace(pattern, " ").replace(/\s+/g, " ").trim()
  const serializedQualifiers = [
    ...new Set(values.map((value) => value.trim()).filter(Boolean)),
  ].map((value) => {
    const serializedValue = /\s/.test(value)
      ? `"${value.replaceAll('"', "")}"`
      : value

    return `${qualifier}:${serializedValue}`
  })

  return [text, ...serializedQualifiers].filter(Boolean).join(" ")
}
