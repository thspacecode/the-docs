# The Docs

A file-based documentation site built with React Router, MDX, Tailwind CSS, and shadcn/ui.

## Development

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
  - architecture
  - guide
---

## Document content
```

Document slugs must contain lowercase letters, numbers, and hyphens. The home page lists every discovered document and `/docs/p/<slug>` renders its MDX content.

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
