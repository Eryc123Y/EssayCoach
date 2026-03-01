# Contribution Guide

This document is generated from the current source of truth:

- `frontend/package.json` (`scripts` section)
- `.env.example`

## Development Workflow

1. Install frontend dependencies in `frontend/`:
   - `pnpm install`
2. Set required environment variables from `.env.example` (project root).
3. Start local development server:
   - `pnpm dev`
4. Before opening a PR, run quality checks in this order:
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build`

## Available Scripts

Source: `frontend/package.json` -> `scripts`

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `next dev -H 127.0.0.1 -p 5100` | Start Next.js dev server on `127.0.0.1:5100`. |
| `build` | `next build` | Create production build output. |
| `start` | `next start` | Start the production server from the built app. |
| `lint` | `next lint` | Run Next.js lint checks. |
| `lint:fix` | `eslint src --fix && pnpm format` | Auto-fix ESLint issues, then run formatting. |
| `lint:strict` | `eslint --max-warnings=0 src` | Fail if any ESLint warnings exist. |
| `test` | `vitest run` | Run frontend test suite once. |
| `format` | `prettier --write .` | Format files in-place with Prettier. |
| `format:check` | `prettier -c -w .` | Check formatting and write fixes. |
| `prepare` | `husky` | Initialize git hooks via Husky. |

## Environment Setup

Source: `.env.example`

| Variable | Format | Purpose |
| --- | --- | --- |
| `DIFY_API_KEY` | string token | API key for Dify integration. |
| `DIFY_BASE_URL` | URL | Base URL for Dify API endpoint. |
| `SILICONFLOW_API_KEY` | string token | API key for SiliconFlow integration. |
| `DEBUG` | boolean (`True`/`False`) | Django debug mode toggle. |
| `SECRET_KEY` | string secret | Django application secret key. |
| `ALLOWED_HOSTS` | comma-separated hosts | Allowed hostnames for Django. |
| `POSTGRES_DB` | string | PostgreSQL database name. |
| `POSTGRES_USER` | string | PostgreSQL username. |
| `POSTGRES_PASSWORD` | string | PostgreSQL password. |
| `POSTGRES_HOST` | hostname/IP | PostgreSQL host address. |
| `POSTGRES_PORT` | integer | PostgreSQL port number. |
| `CORS_ALLOWED_ORIGINS` | comma-separated URLs | Allowed CORS origins. |
| `NEXT_PUBLIC_API_URL` | URL | Frontend public API base URL. |

## Test Flow

Use these frontend scripts in order:

1. `pnpm lint`
2. `pnpm test`
3. `pnpm build`

If any command fails, fix issues and rerun from step 1.
