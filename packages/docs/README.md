# `@workspace/docs`

`@workspace/docs` is the documentation domain package. It turns repository-owned MDX files into discoverable React documents, supplies the documentation routes, and provides the build-time integration required to prerender them.

The package is reusable by host applications, but it is not an application itself.

## Responsibilities

### Build time

The package owns the documentation build pipeline:

- Discover flat `docs/<slug>/index.mdx` entries from a host-provided content root.
- Parse frontmatter and expose it with each compiled MDX component.
- Configure MDX, YAML frontmatter, and GitHub Flavored Markdown through Vite.
- Generate the virtual content registry consumed by the runtime package.
- Invalidate the registry when a document changes during development.
- Create the package-owned React Router route configuration.
- Generate prerender paths for every discovered document.

### Runtime

The package owns documentation-specific runtime behavior:

- Normalize document metadata and provide title fallbacks.
- Resolve documents by slug.
- Return a `404` response for unknown slugs.
- Produce document metadata from frontmatter.
- Render the documentation shell and article layout.
- Apply the shared `typeset` surface to rendered MDX content.

## Boundaries

### The host application owns

`apps/web` remains responsible for application and deployment concerns:

- Selecting the content root.
- Composing `createDocsRoutes()` into the application route tree.
- Registering the package's Vite plugins and prerender paths.
- Loading global styles.
- Owning the root HTML document, landing pages, deployment, and server startup.

The package must not import from `apps/web` or assume the host application's filesystem location.

### The UI package owns

`packages/ui` owns the shared visual foundation:

- Global theme tokens and fonts.
- The `typeset` stylesheet and presets.
- Domain-neutral components and styling utilities.

A generic visual primitive belongs in `packages/ui`. A component that understands documents, frontmatter, or documentation navigation belongs in `packages/docs`.

### The content directory owns

The root `docs/` directory contains authored content and colocated assets. It must not contain route registration, Vite configuration, or runtime application logic.

```text
docs/
└── <slug>/
    ├── index.mdx
    └── assets/
```

Only lowercase alphanumeric slug directories with optional hyphens and an `index.mdx` file are currently discovered. Other directories and localized files are ignored by the current pipeline.

## Public API

Consumers must use package exports rather than importing from `src` internals.

### `@workspace/docs`

Runtime content and rendering API:

| Export              | Responsibility                                        |
| ------------------- | ----------------------------------------------------- |
| `getDocument(slug)` | Resolve one normalized document or return `undefined` |
| `getDocuments()`    | Return all discovered documents                       |
| `DocumentPage`      | Render a resolved document                            |
| `DocsShell`         | Render the documentation-level shell                  |
| Document types      | Describe entries, frontmatter, and MDX components     |

### `@workspace/docs/build`

Build and framework integration API:

| Export                                   | Responsibility                                  |
| ---------------------------------------- | ----------------------------------------------- |
| `createDocsRoutes()`                     | Return package-owned React Router route entries |
| `createDocsVitePlugins({ contentRoot })` | Configure content discovery and MDX compilation |
| `getDocsPrerenderPaths(contentRoot)`     | Return static paths for discovered documents    |

These APIs run in configuration or build contexts and may use Node.js filesystem APIs. Do not import them into browser components.

### `@workspace/docs/route`

The low-level React Router route module, including its loader, metadata, view, and error boundary. Most hosts should use `createDocsRoutes()` instead of registering this module themselves.

## Host integration

The host supplies one content-root path and uses the package at each framework boundary.

```ts
// apps/web/app/routes.ts
import { type RouteConfig, index } from "@react-router/dev/routes"
import { createDocsRoutes } from "@workspace/docs/build"

export default [
  index("routes/home.tsx"),
  ...createDocsRoutes(),
] satisfies RouteConfig
```

```ts
// apps/web/vite.config.ts
plugins: [
  ...createDocsVitePlugins({ contentRoot: docsContentRoot }),
  reactRouter(),
]
```

```ts
// apps/web/react-router.config.ts
export default {
  prerender: ["/", ...getDocsPrerenderPaths(docsContentRoot)],
}
```

Route creation and prerender discovery must be configured together so every generated document URL can be built statically.

## Content contract

Frontmatter supports these fields:

```yaml
---
title: Package title
description: A short summary used for page metadata.
tags:
  - architecture
---
```

- `title` falls back to a title-cased slug when absent.
- `description` is optional.
- `tags` is normalized to an array of strings.
- Markdown tables and other GFM syntax are enabled.
- Rendered MDX is wrapped by the `typeset typeset-docs` surface; authored elements should not carry presentation classes.
- Embedded components can opt out of Typeset with `not-typeset` or `data-not-typeset`.

## Data flow

1. The host passes `contentRoot` to the docs Vite plugin.
2. The plugin discovers valid MDX entry files and creates `virtual:docs-content`.
3. MDX files compile into React components while frontmatter becomes registry metadata.
4. The runtime registry normalizes metadata and indexes entries by slug.
5. The route loader resolves `params.slug` and returns serializable metadata.
6. The route renders the matching MDX component or throws a `404` response.
7. React Router prerenders the same discovered slugs during production builds.

## Placement guide

Add code to this package when it is specific to documentation discovery, metadata, routing, rendering, or documentation build behavior.

Do not add code here when it is:

- Host-specific routing composition, deployment, or environment configuration.
- A domain-neutral design primitive or global theme token.
- Authored product documentation.
- Backend persistence or API behavior.

Maintaining these boundaries keeps the docs pipeline reusable without coupling it to a particular application.
