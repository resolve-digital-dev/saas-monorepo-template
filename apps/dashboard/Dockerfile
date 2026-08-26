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
RUN pnpm dlx turbo@${TURBO_VERSION} prune @resolvedigital/dashboard --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

# Vite inlines VITE_* at build time, so the API URL has to be a build arg;
# passing it at runtime to a static bundle does nothing. vite.config.ts
# validates it here, so a typo fails the image build instead of the browser.
ARG VITE_API_URL=http://localhost:3001/api
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm turbo run build --filter=@resolvedigital/dashboard

# Unprivileged nginx image: listens on 8080 and runs as uid 101 by default.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner
COPY --from=installer /app/apps/dashboard/dist /usr/share/nginx/html
# Both files land in conf.d: nginx auto-includes *.conf, and default.conf pulls
# in the .inc (which is deliberately not a .conf so it is not auto-included).
COPY --from=installer /app/apps/dashboard/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=installer /app/apps/dashboard/nginx/security-headers.inc /etc/nginx/conf.d/security-headers.inc

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
