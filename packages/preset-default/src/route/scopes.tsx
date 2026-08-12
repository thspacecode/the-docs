import { getScopes, ScopesPage } from "@workspace/core"

export function meta() {
  return [
    { title: "Scopes · The Docs" },
    {
      name: "description",
      content: "Browse curated documentation scopes.",
    },
  ]
}

export default function ScopesRoute() {
  return <ScopesPage scopes={getScopes()} />
}
