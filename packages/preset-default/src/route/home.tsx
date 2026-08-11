import { getDocuments, getScopes, getTags, HomePage } from "@workspace/core"

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
  return (
    <HomePage
      documents={getDocuments()}
      scopes={getScopes()}
      tags={getTags()}
      description="Architecture notes and guides for The Docs."
    />
  )
}
