import { DocumentListPage, getDocuments } from "@workspace/core"

export function meta() {
  return [
    { title: "Documentation list · The Docs" },
    {
      name: "description",
      content: "Search and browse all documentation.",
    },
  ]
}

export default function ListPage() {
  return <DocumentListPage documents={getDocuments()} />
}
