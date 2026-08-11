import { DocumentListPage, getDocuments } from "@workspace/core"

export function meta() {
  return [
    { title: "The Docs" },
    {
      name: "description",
      content: "Architecture notes and guides for The Docs.",
    },
  ]
}

export default function Home() {
  return <DocumentListPage documents={getDocuments()} />
}
