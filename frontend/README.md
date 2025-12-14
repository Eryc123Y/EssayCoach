## Frontend Linting, Formatting, and Components Guide

This guide explains how to lint and format code in the frontend, and how to work with UI components (including shadcn/ui components).

### Quick start

- Install deps (inside `frontend/`):

```bash
pnpm install
```

- Lint the code:

```bash
pnpm run lint
```

- Auto-fix lint issues and format:

```bash
pnpm run lint:fix
```

- Strict lint (fail on warnings):

```bash
pnpm run lint:strict
```

- Format the codebase with Prettier:

```bash
pnpm run format
```


### What are ESLint and Prettier?

- **ESLint**: a tool that finds code problems (bugs, anti‑patterns) and enforces best practices.
- **Prettier**: a code formatter that makes code style consistent across the project.

Use both together: ESLint for correctness and best practices, Prettier for consistent formatting.


### ESLint

- Config file: `.eslintrc.json`
- Base config: `next/core-web-vitals` (includes recommended React/Next rules)
- Additional plugin: `@typescript-eslint`

Common scripts:

```bash
# Lint with Next.js integration
pnpm run lint

# Lint and auto-fix issues (then run Prettier)
pnpm run lint:fix

# Fail the build/CI on any warnings
pnpm run lint:strict
```

Tip: If you run `eslint` directly, prefer targeting the `src` folder (as in the scripts), to avoid scanning generated folders.


### Prettier

- Config file: `.prettierrc`
- Ignore file: `.prettierignore`
- Tailwind class ordering is handled by `prettier-plugin-tailwindcss`.

Scripts:

```bash
# Format the entire project
pnpm run format

# Format and check (as configured)
pnpm run format:check
```


### Recommended VS Code setup

1) Install extensions: “ESLint” and “Prettier - Code formatter”  
2) In VS Code settings (or `.vscode/settings.json`), enable:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  }
}
```

This will run Prettier on save and make ESLint quick-fixes available (run them explicitly or via Save with Code Actions).


### Components overview

- Local components live in `src/components/` and can be imported with the alias `@/components/...`.
- Utility helpers used by components live under `src/lib/` and can be imported with `@/lib/...`.
- The project includes [shadcn/ui](https://ui.shadcn.com) configuration via `components.json` to add high-quality, Tailwind-based UI primitives.


### Adding shadcn/ui components

You can add new shadcn/ui components using the CLI. From `frontend/`:

```bash
pnpm dlx shadcn-ui@latest add button
```

- This respects the aliases from `components.json` (e.g., `@/components` and `@/lib/utils`).
- Components will be placed under `src/components/` and styled using Tailwind (configured in `app/globals.css`).

More examples:

```bash
pnpm dlx shadcn-ui@latest add dialog
pnpm dlx shadcn-ui@latest add input
pnpm dlx shadcn-ui@latest add select
```

Refer to the shadcn/ui docs for available components and usage examples: [shadcn/ui documentation](https://ui.shadcn.com).


### Creating custom components

- Place them in `src/components/`.
- Use TypeScript and type your props for clarity.
- Prefer small, focused components that do one thing well.
- Keep presentation (UI) separate from data fetching and heavy logic—use hooks in `src/hooks/` for logic when appropriate.
- Use the `cn`/`clsx` pattern (see utilities in `@/lib/utils`) to compose class names cleanly.


### Best practices

- Run `pnpm run lint:fix` before pushing to keep the codebase clean.
- Keep imports tidy; rely on editor actions to organize imports.
- Prefer named exports for reusable utilities; for components, be consistent with the existing codebase patterns.
- Keep files small and cohesive; split large components into smaller parts.


### Troubleshooting

- “Cannot find plugin or config” errors: ensure dependencies are installed with `pnpm install`.
- ESLint or Prettier not running in the editor: check that the VS Code extensions are enabled and the settings above are applied.
- Tailwind classes not ordering: confirm `prettier-plugin-tailwindcss` is installed and Prettier is the default formatter.

### Git hooks (Husky + lint-staged)

- Pre-commit hook is configured at the repo root in `.husky/pre-commit` to run ESLint + Prettier on staged files in `frontend/`.
- If hooks don’t run on your machine (first-time setup), bootstrap Husky once:

```bash
pnpm -C frontend dlx husky@latest init
```

- Then try committing again. You should see lint-staged run and fix issues before the commit completes.
