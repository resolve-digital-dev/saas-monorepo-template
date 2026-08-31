# Resolve Digital Monorepo Template

Turborepo starter for SaaS products: a Next.js marketing site, a Vite dashboard, a NestJS API and
the shared packages that hold them together.

## Why we use this stack at Resolve Digital

We build B2B SaaS applications for growing businesses. Our clients need features shipped fast, but they cannot afford technical debt or fragile architecture. This template is our answer.

- **Speed to Market:** We don't waste the first two weeks configuring linters and Docker. We clone this repository and start writing business logic on day one. This is how we deliver in 8 weeks.
- **Built to Scale:** Next.js handles SEO-critical marketing pages, while NestJS powers the heavy backend logic. They are strictly separated but share the same database and types.
- **Enterprise Reliability:** Strict TypeScript, automated testing, and CI/CD pipelines ensure that a single typo cannot bring down production. Your clients will not see raw database errors.

## Tech Stack

| Layer     | Choice                                            |
| --------- | ------------------------------------------------- |
| Monorepo  | Turborepo + pnpm workspaces                       |
| Backend   | NestJS 11 (port 3001, routes under `/api/v1`)     |
| Landing   | Next.js 16 App Router (port 3000)                 |
| Dashboard | Vite 8 + React 19 SPA (port 5173)                 |
| Database  | PostgreSQL 16 + Drizzle ORM                       |
| UI        | Tailwind CSS 4 + shadcn-style components          |
| i18n      | ParaglideJS 2                                     |
| Quality   | TypeScript 6, ESLint 9 (flat), Prettier, Vitest 4 |

## Structure

```text
apps/
  backend/          # NestJS API
  dashboard/        # Vite React SPA
  landing/          # Next.js App Router
packages/
  database/         # Drizzle schema, client, migrations, seed
  ui/               # Shared Tailwind components
  i18n/             # ParaglideJS messages (compiled)
  logger/           # Pino logger, owns LOG_LEVEL
  eslint-config/
  typescript-config/
scripts/rename.mjs  # Rebrand the template
```

## Quick Start

```bash
# 1. Environment. There is ONE .env, at the repository root; every app reads it.
cp .env.example .env

# 2. Toolchain (Node 22, pnpm 11 via corepack). engine-strict is on, so an older
#    Node fails the install instead of failing later and mysteriously.
nvm use
corepack enable

# 3. Dependencies
pnpm install

# 4. PostgreSQL
docker compose up -d db

# 5. Schema + demo data
pnpm db:migrate
pnpm db:seed

# 6. Run everything
pnpm dev
```

| Service   | URL                                             |
| --------- | ----------------------------------------------- |
| Landing   | http://localhost:3000                           |
| Dashboard | http://localhost:5173                           |
| API       | http://localhost:3001/api/v1                    |
| OpenAPI   | http://localhost:3001/api/docs (non-production) |
| Health    | http://localhost:3001/api/health (and `/ready`) |

Both frontends call the API on load and render what comes back, so a wrong `API_URL` /
`VITE_API_URL` is visible immediately rather than at the first real feature.

## Scripts

| Command              | Effect                                              |
| -------------------- | --------------------------------------------------- |
| `pnpm dev`           | All apps in watch mode                              |
| `pnpm build`         | Build every workspace                               |
| `pnpm lint`          | ESLint everywhere, including the repository root    |
| `pnpm typecheck`     | `tsc --noEmit` everywhere                           |
| `pnpm test`          | Vitest across the monorepo                          |
| `pnpm test:coverage` | Same, with per-package coverage thresholds          |
| `pnpm format`        | Prettier write (`format:check` in CI)               |
| `pnpm clean`         | Remove build outputs and caches                     |
| `pnpm db:generate`   | Generate a migration from schema changes            |
| `pnpm db:migrate`    | Apply migrations                                    |
| `pnpm db:push`       | Push schema without a migration (local prototyping) |
| `pnpm db:seed`       | Reset and seed demo data                            |
| `pnpm db:studio`     | Drizzle Studio                                      |

## Environment variables

All variables live in the root `.env`, and each consumer validates what it needs:

- **backend** - zod schema in `apps/backend/src/env.ts`; the process exits on invalid input.
- **landing** - `@t3-oss/env-nextjs` in `apps/landing/env.ts`, imported from `next.config.mjs`, so
  an invalid environment fails the build.
- **dashboard** - zod schema in `apps/dashboard/src/env.schema.ts`, evaluated in `vite.config.ts`,
  so a bad value fails the build rather than the browser.
- **database** - zod schema in `packages/database/src/env.ts`; no fallback connection string.
- **LOG_LEVEL** - owned by `packages/logger` alone, so there is one schema rather than two that
  disagree.

URL variables are checked for scheme as well as shape: a bare `z.url()` accepts `localhost:3001`,
because that parses as a URL whose scheme is `localhost`.

Two API URLs, deliberately:

| Variable                               | Read when  | Reachable from                             |
| -------------------------------------- | ---------- | ------------------------------------------ |
| `NEXT_PUBLIC_API_URL` / `VITE_API_URL` | build time | the **browser** (inlined into the bundle)  |
| `API_URL`                              | run time   | the **landing container** (`backend:3001`) |

Inside Docker `localhost` means the container itself, so one URL cannot serve both. `API_URL` falls
back to `NEXT_PUBLIC_API_URL` when unset, which is what a single-host deployment wants.

`SKIP_ENV_VALIDATION` accepts `1`, `true` or `yes`. `0` and `false` do **not** switch it on - the
usual `Boolean(process.env.X)` implementation of this flag gets that backwards.

When adding a variable: update `.env.example`, the relevant schema, and `globalEnv` in `turbo.json`
(otherwise Turbo will serve a stale cached build).

## Docker

```bash
docker compose build
docker compose up -d
docker compose logs -f
```

Each app has a multi-stage Dockerfile that prunes the monorepo with a pinned `turbo prune`,
installs with a frozen lockfile and ships a production-only closure. All three run as non-root and
expose a `HEALTHCHECK`.

Startup order is `db` (healthy), then `migrate` (runs to completion), then `backend` (healthy),
then the frontends. The `migrate` service reuses the backend image and runs the **compiled**
migrator that travels inside `@resolvedigital/database`; `tsx` is a devDependency and is
deliberately not in the image.

The dashboard image serves the SPA through nginx. Its security headers live in a separate
`security-headers.inc` that every `location` block includes, because nginx `add_header` inheritance
is all-or-nothing: a block that sets one header of its own silently drops every inherited one.

## i18n

Messages live in `packages/i18n/messages/*.json`. `pnpm build` compiles them into
`packages/i18n/src/paraglide/` (generated, git-ignored) plus `.d.ts` files. Adding a locale means
adding it to `packages/i18n/project.inlang/settings.json` and creating the matching JSON file.

Because the compiled output is generated, that package's own `lint` and `typecheck` depend on its
`build` (see `packages/i18n/turbo.json`) - otherwise a fresh clone fails with
`TS18003: No inputs were found` before anything has had a chance to compile.

On the server, locale comes from the paraglide cookie read explicitly per request
(`apps/landing/app/lib/locale.ts`) and is passed to each message function. Paraglide's own
`getLocale()` reads an AsyncLocalStorage store that only `paraglideMiddleware` fills, and Next.js
middleware runs in a different execution context from the RSC render - calling it from a server
component silently pins the page to the base locale.

## UI package

`packages/ui` ships raw TypeScript and is transpiled by each consumer (`transpilePackages` in Next,
natively in Vite).

Tailwind 4 is CSS-first: the old `tailwind.config.ts` preset now lives in
`packages/ui/src/globals.css` as `@theme` / `@custom-variant` blocks.

`@source` replaces the old `content` array. Because consumers import that CSS from `node_modules`,
which Tailwind does not scan by default, the package registers its own sources with `@source "./"`.
Removing that line silently purges every shared class.

## Standards

- **Strict TypeScript** - `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- **ESLint fails builds** - flat config (ESLint 9), every workspace runs with `--max-warnings 0`,
  and the backend additionally uses type-aware rules (`no-floating-promises`,
  `no-misused-promises`). `pnpm lint` covers the repository root too, through the `//#lint:root`
  task - `turbo run lint` alone never runs anything in the root package.
- **Pre-commit actually lints.** `lint-staged` runs ESLint with
  `--flag v10_config_lookup_from_file`, so each staged file is checked against **its own** package
  config. Without it ESLint resolves config from the working directory, finds only the root config
  (which ignores `apps/**` and `packages/**`) and reports every file as "ignored" - which
  `--max-warnings 0` then turns into a failed commit. Drop the flag when this repo moves to
  ESLint 10, where that behaviour is the default.
- **Conventional Commits** enforced by commitlint.
- **API defaults** - URI versioning (`/api/v1`, health stays version-neutral), a global exception
  filter that never echoes a driver error to the client, per-client rate limiting that exempts the
  health probes, correlation ids via `x-request-id`, and response DTOs so a new column cannot leak
  into a public payload by accident.
- **CI** runs format, lint, typecheck, coverage and build, audits dependencies, and only then
  builds all three Docker images and checks each one actually contains its entrypoint.
- **Supply chain** - pnpm rejects dependencies published in the last 24h (`minimumReleaseAge`) and
  refuses to run install scripts unless allow-listed. The allow-list holds package **names**, not
  `name@version`, so it does not silently re-arm on the next patch bump.

## Rebranding

```bash
node scripts/rename.mjs --scope acme --name acme-app --display "Acme Inc" --dry  # preview
node scripts/rename.mjs --scope acme --name acme-app --display "Acme Inc"
pnpm install
```

It rewrites the npm scope, the root package name, the display name and the database name (`--db`,
defaulting to `--scope`) across sources, `.env*`, compose and the Dockerfiles. It refuses to run
outside the repository root and leaves itself untouched, so a second run still knows the original
names.
