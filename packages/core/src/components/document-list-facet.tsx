import { useMemo } from "react"

import type { TagDefinition, TypeDefinition } from "../content/types"
import type { SearchQualifier } from "../search/document-search"

interface FacetOption {
  value: string
  label: string
  depth?: number
}

const importanceOptions: FacetOption[] = [
  { value: "highest", label: "Highest" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "lowest", label: "Lowest" },
]

function normalize(value: string) {
  return value.trim().toLocaleLowerCase()
}

function fallbackLabel(value: string) {
  return value
    .split(/[-/]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1))
    .join(" ")
}

function typeOptions(types: TypeDefinition[], documentTypes: string[]) {
  const definitionsBySlug = new Map(types.map((type) => [type.slug, type]))
  const values = new Set([
    ...types.map((type) => type.slug),
    ...documentTypes.filter(Boolean),
  ])

  return [...values]
    .map((value) => ({
      value,
      label: definitionsBySlug.get(value)?.title ?? fallbackLabel(value),
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

function tagOptions(tags: TagDefinition[], documentTags: string[]) {
  const definitionsBySlug = new Map(tags.map((tag) => [tag.slug, tag]))
  const allTags = [
    ...tags,
    ...documentTags
      .filter((slug) => !definitionsBySlug.has(slug))
      .map(
        (slug): TagDefinition => ({
          slug,
          title: fallbackLabel(slug.split("/").at(-1) ?? slug),
          description: "",
        })
      ),
  ]
  const allTagsBySlug = new Map(allTags.map((tag) => [tag.slug, tag]))
  const children = new Map<string | undefined, TagDefinition[]>()

  for (const tag of allTags) {
    const parentSlug =
      tag.parentSlug && allTagsBySlug.has(tag.parentSlug)
        ? tag.parentSlug
        : undefined
    const siblings = children.get(parentSlug) ?? []
    siblings.push(tag)
    children.set(parentSlug, siblings)
  }

  for (const siblings of children.values()) {
    siblings.sort((left, right) => left.title.localeCompare(right.title))
  }

  const options: FacetOption[] = []
  const visited = new Set<string>()

  function visit(parentSlug: string | undefined, depth: number) {
    for (const tag of children.get(parentSlug) ?? []) {
      if (visited.has(tag.slug)) continue
      visited.add(tag.slug)
      options.push({ value: tag.slug, label: tag.title, depth })
      visit(tag.slug, depth + 1)
    }
  }

  visit(undefined, 0)

  // Invalid cyclic definitions should remain usable instead of disappearing.
  for (const tag of allTags) {
    if (!visited.has(tag.slug)) {
      options.push({ value: tag.slug, label: tag.title, depth: 0 })
    }
  }

  return options
}

function FacetGroup({
  label,
  qualifier,
  options,
  values,
  onChange,
}: {
  label: string
  qualifier: SearchQualifier
  options: FacetOption[]
  values: string[]
  onChange: (qualifier: SearchQualifier, values: string[]) => void
}) {
  const normalizedValues = new Set(values.map(normalize))

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-foreground">
        {label}
      </legend>
      <ul className="space-y-1" aria-label={`${label} filters`}>
        {options.map((option) => {
          const checked = normalizedValues.has(normalize(option.value))

          return (
            <li key={option.value}>
              <label
                className="flex min-h-7 cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-sm text-muted-foreground transition-colors hover:bg-grey-3 hover:text-foreground"
                style={{
                  paddingInlineStart: `${(option.depth ?? 0) * 1.125 + 0.25}rem`,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(
                      qualifier,
                      checked
                        ? values.filter(
                            (value) =>
                              normalize(value) !== normalize(option.value)
                          )
                        : [...values, option.value]
                    )
                  }
                  className="mt-0.5 size-4 shrink-0 accent-primary-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
                <span
                  className={
                    checked ? "font-medium text-foreground" : undefined
                  }
                >
                  {option.label}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

export function DocumentListFacet({
  tags,
  types,
  documentTags,
  documentTypes,
  qualifiers,
  onChange,
}: {
  tags: TagDefinition[]
  types: TypeDefinition[]
  documentTags: string[]
  documentTypes: string[]
  qualifiers: Record<SearchQualifier, string[]>
  onChange: (qualifier: SearchQualifier, values: string[]) => void
}) {
  const availableTypeOptions = useMemo(
    () => typeOptions(types, documentTypes),
    [documentTypes, types]
  )
  const availableTagOptions = useMemo(
    () => tagOptions(tags, documentTags),
    [documentTags, tags]
  )

  return (
    <aside className="hidden border-r xl:block" aria-label="Document filters">
      <div className="sticky top-16 max-h-[calc(100svh-4rem)] space-y-6 overflow-y-auto px-6 py-4 sm:px-11">
        <h2 className="sr-only">Filter documents</h2>
        <FacetGroup
          label="Importance"
          qualifier="importance"
          options={importanceOptions}
          values={qualifiers.importance}
          onChange={onChange}
        />
        {availableTypeOptions.length ? (
          <FacetGroup
            label="Types"
            qualifier="type"
            options={availableTypeOptions}
            values={qualifiers.type}
            onChange={onChange}
          />
        ) : null}
        {availableTagOptions.length ? (
          <FacetGroup
            label="Tags"
            qualifier="tag"
            options={availableTagOptions}
            values={qualifiers.tag}
            onChange={onChange}
          />
        ) : null}
      </div>
    </aside>
  )
}
