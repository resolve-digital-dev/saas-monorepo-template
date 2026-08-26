# syntax=docker/dockerfile:1
# Shared bootstrap: pnpm via corepack, pinned by the root packageManager field.
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Isolate the subset of the monorepo this app actually needs.
FROM base AS pruner
# Pinned rather than floating on `turbo@2`: an unpinned dlx silently builds the
# image with a different turbo than the repo. Keep in sync with the `turbo`
# devDependency in the root package.json.
ARG TURBO_VERSION=2.10.12
COPY . .
RUN pnpm dlx turbo@${TURBO_VERSION} prune @resolvedigital/backend --docker

FROM base AS installer
# Lockfile-only layer first: dependencies change far less often than sources.
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
# Nothing here opens a connection, but the workspace's env modules are imported
# during the build; this keeps the image build independent of a real database.
ENV SKIP_ENV_VALIDATION=1
RUN pnpm turbo run build --filter=@resolvedigital/backend

# Production closure: prod dependencies only, no sources, no toolchain.
# `@resolvedigital/database` declares `drizzle` in its `files`, so the compiled
# migrator and the SQL files travel with it - that is what the `migrate`
# service in docker-compose.yml runs.
RUN pnpm --filter=@resolvedigital/backend --prod --legacy deploy /prod/backend

FROM base AS runner
ENV NODE_ENV=production

COPY --from=installer --chown=node:node /prod/backend ./

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
