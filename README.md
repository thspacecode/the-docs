# The Docs

A file-based documentation application built with React Router, MDX, Vite, and shadcn/ui in a pnpm monorepo.

## Workspace

| Path            | Responsibility                                                                  |
| --------------- | ------------------------------------------------------------------------------- |
| `apps/web`      | Thin React Router host, route registration, build configuration, and deployment |
| `packages/docs` | MDX discovery, frontmatter, prerendering, docs routes, and document UI          |
| `packages/ui`   | Shared design tokens, global styles, utilities, and domain-neutral components   |
| `docs`          | Version-controlled documentation content organized by slug                      |

Dependencies flow from `apps/web` into reusable packages. Packages must not import application code. See [Packages and boundaries](docs/package-boundaries/index.mdx) for ownership rules and examples.

## Development

```bash
pnpm install --frozen-lockfile
pnpm --filter web dev
```

The sample documentation is available at `/docs/p/getting-started`.

## Validation

```bash
pnpm typecheck
pnpm build
```
