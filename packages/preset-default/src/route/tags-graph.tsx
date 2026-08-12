import { getDocuments, getTags, TagsPage } from "@the-docs/core"

export function meta() {
  return [
    { title: "Tag graph · The Docs" },
    {
      name: "description",
      content: "Explore relationships between documentation tags.",
    },
  ]
}

export default function TagsGraphPage() {
  return <TagsPage documents={getDocuments()} tags={getTags()} view="graph" />
}
