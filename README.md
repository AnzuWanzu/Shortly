# Shortly

An in-progress URL-shortener infrastructure learning project.

Private learning notes and any onboarding-derived material are kept outside this repository.

## First-time setup

Use Node.js 24, pnpm 11.19.0 (the version in `package.json`), and Docker with
Compose v2. Run commands from the repository root.

```sh
pnpm install --frozen-lockfile
cp -n .env.example .env
pnpm exec prisma generate --config prisma7.config.ts
```

Edit `.env` before starting services. Keep `POSTGRES_PASSWORD` and the password
in `DATABASE_URL` consistent. For host development, set
`REDIS_URL=redis://localhost:6767` to match the example's `REDIS_PORT=6767`.
The current example URL uses port 6379, which is the container's internal port.
If you change published ports, update the host URLs accordingly. Keep `.env`
private and never commit credentials.

## Development commands

Run these from the repository root. The package scripts delegate to Nx, keeping
its existing targets and caching.

| Command              | What it runs                             |
| -------------------- | ---------------------------------------- |
| `pnpm run dev`       | API and web development servers together |
| `pnpm run dev:api`   | API development server only              |
| `pnpm run dev:web`   | Web development server only              |
| `pnpm run test`      | API and web unit/component tests         |
| `pnpm run lint`      | API and web lint checks                  |
| `pnpm run typecheck` | API and web TypeScript checks            |
| `pnpm run build`     | API and web builds                       |

For checks on one app, append `:api` or `:web`, for example
`pnpm run test:api` or `pnpm run lint:web`. Database integration tests remain
separate: `pnpm exec nx run api:integration`.

Development servers require the configured PostgreSQL and Redis services. Start
only those services when developing on the host:

```sh
docker compose --env-file .env --file infrastructure/local/compose.yaml up -d postgres redis
pnpm run dev
```

On the first run, apply the existing database migrations before `pnpm run dev`:

```sh
pnpm exec prisma migrate deploy --config prisma7.config.ts
```

Open `http://localhost:4200`. The API defaults to `http://localhost:3333`;
the frontend development proxy expects that API port.

```sh
curl --include http://localhost:3333/health
curl --include http://localhost:3333/ready
```

`/health` checks that the API responds. `/ready` also checks the database.

Use host-reachable database and Redis addresses in `.env`. Stop development
servers with Ctrl+C. The existing `pnpm run infra:up` starts the full container
stack, including the API and web; stop that stack before running host development
servers to avoid port conflicts.

## Full Docker stack

This runs PostgreSQL, Redis, migrations, the API, and the built frontend in Docker.
Stop host development servers first.

```sh
pnpm run infra:up
pnpm run infra:status
```

To rebuild images after source changes and wait for readiness:

```sh
docker compose --env-file .env --file infrastructure/local/compose.yaml up -d --build --wait
```

Open `http://localhost:4200` with the default ports. Inspect logs or stop the stack:

```sh
docker compose --env-file .env --file infrastructure/local/compose.yaml logs --tail=100 -f api web
pnpm run infra:down
```

`infra:down` retains the PostgreSQL named volume. Avoid adding `--volumes` unless
you intend to erase the local database. The migration container exiting with code
0 is expected; it is a one-time job.

## Checks before committing

```sh
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
git diff --check
git status --short --branch
```

Nx may reuse successful cached results. To rerun tests without the cache:

```sh
pnpm run test --skip-nx-cache
```

Format only the files you changed, for example:

```sh
pnpm exec prettier --write README.md package.json
```

## Prisma commands

```sh
pnpm exec prisma validate --config prisma7.config.ts
pnpm exec prisma migrate status --config prisma7.config.ts
pnpm exec prisma studio --config prisma7.config.ts
```

After editing `prisma/schema.prisma`, create a migration using a descriptive name,
review the generated SQL, apply it, and regenerate the client:

```sh
pnpm exec prisma migrate dev --config prisma7.config.ts --name describe_your_change --create-only
pnpm exec prisma migrate dev --config prisma7.config.ts
pnpm exec prisma generate --config prisma7.config.ts
```

Use `migrate dev` only against a development database. Use `migrate deploy` to
apply existing migrations without creating new ones.

API integration tests require a separate, migrated database configured through
`DATABASE_URL_TEST`. They create and delete test records; never point this URL
at a production database. With the test database prepared, run:

```sh
pnpm exec nx run api:integration
```
