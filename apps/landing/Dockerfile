# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS pruner
# Keep in sync with the `turbo` devDependency in the root package.json.
ARG TURBO_VERSION=2.10.12
COPY . .
RUN pnpm dlx turbo@${TURBO_VERSION} prune @resolvedigital/landing --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

# NEXT_PUBLIC_* is inlined into the client bundle at build time; API_URL is read
# at runtime by server components and is therefore NOT baked in here.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_OUTPUT_STANDALONE=true

RUN pnpm turbo run build --filter=@resolvedigital/landing

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# `output: standalone` already traced the exact runtime closure.
COPY --from=installer --chown=node:node /app/apps/landing/public ./apps/landing/public
COPY --from=installer --chown=node:node /app/apps/landing/.next/standalone ./
COPY --from=installer --chown=node:node /app/apps/landing/.next/static ./apps/landing/.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/landing/server.js"]
