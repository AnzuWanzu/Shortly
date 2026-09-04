FROM node:24-bookworm-slim AS build

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/api ./apps/api
COPY prisma ./prisma
COPY prisma7.config.ts ./prisma7.config.ts

RUN pnpm install --frozen-lockfile
RUN pnpm nx build api

FROM build AS migrate

ENV NODE_ENV=production

RUN chmod -R a+rX package.json pnpm-workspace.yaml prisma7.config.ts prisma

USER node

CMD ["pnpm", "exec", "prisma", "migrate", "deploy", "--config", "prisma7.config.ts"]

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable

COPY --from=build --chown=node:node /workspace/package.json ./package.json
COPY --from=build --chown=node:node /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build --chown=node:node /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --prod --frozen-lockfile
RUN pnpm pkg delete type
COPY --from=build --chown=node:node /workspace/dist/apps/api/main.js ./main.js
COPY --from=build --chown=node:node /workspace/dist/apps/api/main.js.map ./main.js.map

USER node
EXPOSE 3333

CMD ["node", "main.js"]
