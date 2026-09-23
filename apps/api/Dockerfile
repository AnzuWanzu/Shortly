FROM node:24-trixie-slim AS build

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/api ./apps/api
COPY prisma7.config.ts ./prisma7.config.ts
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile
RUN pnpm exec prisma generate --config prisma7.config.ts
RUN pnpm nx build api
RUN pnpm --dir dist/apps/api pkg set dependencies.tslib=2.8.1 \
  && mkdir /runtime \
  && cp dist/apps/api/package.json dist/apps/api/pnpm-lock.yaml /runtime/ \
  && cd /runtime \
  && pnpm install --lockfile-only --config.auto-install-peers=false

FROM node:24-trixie-slim AS migrate

ENV NODE_ENV=production
WORKDIR /workspace

RUN apt-get update \
  && apt-get install --yes --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

COPY --chmod=644 infrastructure/migrations/package.json infrastructure/migrations/pnpm-lock.yaml infrastructure/migrations/pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --chmod=644 prisma7.config.ts ./prisma7.config.ts
COPY --chmod=755 prisma ./prisma

RUN chmod -R a+rX prisma

USER node

CMD ["pnpm", "exec", "prisma", "migrate", "deploy", "--config", "prisma7.config.ts"]

FROM node:24-trixie-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable

COPY --from=build --chown=node:node /runtime/package.json ./package.json
COPY --from=build --chown=node:node /runtime/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build --chown=node:node /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --prod --frozen-lockfile --config.auto-install-peers=false \
  && pnpm pkg delete type \
  && corepack disable \
  && rm pnpm-workspace.yaml \
  && rm -rf \
    /opt/yarn-* \
    /usr/local/lib/node_modules/corepack \
    /usr/local/lib/node_modules/npm \
    /usr/local/bin/corepack \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/bin/pnpm \
    /usr/local/bin/pnpx \
    /usr/local/bin/yarn \
    /usr/local/bin/yarnpkg
COPY --from=build --chown=node:node /workspace/dist/apps/api/main.js ./main.js
COPY --from=build --chown=node:node /workspace/dist/apps/api/main.js.map ./main.js.map

USER node
EXPOSE 3333

CMD ["node", "main.js"]
