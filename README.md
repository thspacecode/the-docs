# The Docs

A file-based documentation site built with React Router, MDX, Tailwind CSS, and shadcn/ui.

## Create a documentation site

After the initial packages are published to npm, scaffold a standalone site with:

```bash
pnpm create the-docs@alpha my-docs
cd my-docs
pnpm install
pnpm dev
```

The package family is published under `@the-docs/*`. Publishing requires membership
in the `the-docs` npm organization. Configure each package's npm trusted publisher
for GitHub repository `thspacecode/the-docs`, workflow `publish-npm.yml`, and the
`npm publish` action; the workflow uses short-lived OIDC credentials instead of an
`NPM_TOKEN` secret.

## Monorepo development

```bash
pnpm install
pnpm --filter docs-of-the-docs dev
```

The app reads documents from `docs/<slug>/index.mdx`. Each document supports frontmatter for its list and detail views:

```mdx
---
title: Document title
description: A short summary.
tags:
  - docs/architecture
type: doc
---

## Document content
```

Document slugs must contain lowercase letters, numbers, and hyphens. Nested tags use their full slash-delimited slug, and document types are `dr` or `doc`. The home page lists every discovered document and `/p/<slug>` renders its MDX content.

## Scopes

Scopes are curated document hierarchies stored in `docs/_scopes/<scope-slug>/scope.json`. A scope contains ordered sections, optional groups, and document references. Groups can also link to a document themselves:

```json
{
  "title": "Engineering",
  "description": "Engineering documentation.",
  "icon": "blocks",
  "sections": [
    {
      "id": "architecture",
      "title": "Architecture",
      "groups": [
        {
          "id": "packages",
          "title": "Packages",
          "icon": "package",
          "document": { "slug": "packages-boundaries" },
          "documents": [{ "slug": "ui-packages" }]
        }
      ]
    }
  ]
}
```

The optional `icon` fields accept kebab-case [Lucide](https://lucide.dev/icons/) icon names. Documents opened from a scope preserve that navigation context in the URL, for example `/p/packages-boundaries?scope=engineering`.

The default preset renders relative BPMN 2.0 assets as SVG-backed images at build time:

```md
![Order process](./assets/order-process.bpmn)
```

Set `plugins.bpmn` to `false` in `docs.config.ts` to disable BPMN processing, or pass `{ padding: 24 }` to control the generated image padding.

## Validation

```bash
pnpm typecheck
pnpm --filter docs-of-the-docs build
```

The production build prerenders the document list and every discovered document route.

## GitHub Pages deployment

Enable GitHub Pages under **Settings → Pages** and select **GitHub Actions** as the
source. `.github/workflows/deploy-docs-of-the-docs-to-github-pages.yml` builds and
deploys the site on every push to `main`, and can also be started manually.

The workflow gets the site's base path from `actions/configure-pages`, passes it to
the application as `THE_DOCS_BASE_PATH`, and publishes the static files from
`apps/docs-of-the-docs/.build/client`. This supports both repository Pages URLs such
as `https://thspacecode.github.io/the-docs/` and sites served at the domain root.
