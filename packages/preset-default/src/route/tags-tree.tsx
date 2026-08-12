import { getDocuments, getTags, TagsPage } from "@the-docs/core"

export function meta() {
  return [
    { title: "Tags · The Docs" },
    {
      name: "description",
      content: "Browse documentation by tag.",
    },
  ]
}

export default function TagsTreePage() {
  return <TagsPage documents={getDocuments()} tags={getTags()} view="tree" />
}
