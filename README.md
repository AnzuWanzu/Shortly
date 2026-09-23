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
If you change published ports, update the host URLs accordingly. Keep `.env`
private and never commit credentials.

## Development commands

Run these from the repository root. The package scripts delegate to Nx, keeping
its existing targets and caching.

| Command                 | What it runs                             |
| ----------------------- | ---------------------------------------- |
| `pnpm dev:infra:up`     | PostgreSQL and Redis containers only     |
| `pnpm dev:infra:down`   | Stops the local container infrastructure |
| `pnpm dev`              | API and web development servers together |
| `pnpm dev:api`          | API development server only              |
| `pnpm dev:web`          | Web development server only              |
| `pnpm format:check`     | Repository formatting check              |
| `pnpm run test`         | API and web unit/component tests         |
| `pnpm test:integration` | API tests against PostgreSQL and Redis   |
| `pnpm run lint`         | API and web lint checks                  |
| `pnpm run typecheck`    | API and web TypeScript checks            |
| `pnpm run build`        | API and web builds                       |

For checks on one app, append `:api` or `:web`, for example
`pnpm run test:api` or `pnpm run lint:web`. Integration tests remain separate
because they require isolated PostgreSQL and Redis services.

Development servers require the configured PostgreSQL and Redis services. Start
only those services when developing on the host:

```sh
pnpm dev:infra:up
pnpm dev
```

On the first run, apply the existing database migrations before `pnpm dev`:

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

Use host-reachable database and Redis addresses in `.env`. Stop the Nx development
servers with Ctrl+C, then stop PostgreSQL and Redis with `pnpm dev:infra:down`.
Because `dev:infra:up` does not start the containerized API or web app, Nx remains
the only process responsible for their development ports.

The shorter development commands delegate to the full Compose commands:

| Shortcut                | Full command                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm dev:infra:up`     | `docker compose --env-file .env --file infrastructure/local/compose.yaml up -d postgres redis` |
| `pnpm dev:infra:down`   | `docker compose --env-file .env --file infrastructure/local/compose.yaml down`                 |
| `pnpm dev:infra:status` | `docker compose --env-file .env --file infrastructure/local/compose.yaml ps postgres redis`    |

## Kubernetes development with kind

Use these shortcuts while testing the Kubernetes deployment. Do not also start
the Compose development infrastructure; Kubernetes runs its own PostgreSQL and
Redis workloads.

| Shortcut           | Full command                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm kind:up`     | `docker start shortly-control-plane && kubectl config use-context kind-shortly && kubectl wait --for=condition=Ready node/shortly-control-plane --timeout=120s` |
| `pnpm kind:down`   | `docker stop shortly-control-plane`                                                                                                                             |
| `pnpm kind:status` | `kind get clusters && kubectl get nodes && kubectl get deployment,job,pod,service,pvc --namespace shortly`                                                      |
| `pnpm kind:web`    | `kubectl port-forward --namespace shortly service/web 4200:8080`                                                                                                |
| `pnpm kind:api`    | `kubectl port-forward --namespace shortly service/api 3333:3333`                                                                                                |

Start a Kubernetes development session with:

```sh
pnpm kind:up
pnpm kind:status
pnpm kind:web
```

Keep the port-forward terminal open while using `http://localhost:4200`. Stop it
with Ctrl+C, then preserve the cluster while stopping its Docker node:

```sh
pnpm kind:down
```

Create the cluster only on first-time setup:

```sh
kind create cluster --name shortly --wait 60s
```

Avoid `kind delete cluster --name shortly` during normal shutdown because it
deletes the local cluster and its Kubernetes-managed data.

## End-of-day shutdown

Stop any foreground development server or `kubectl port-forward` first with
Ctrl+C.

After normal Nx development, stop the Compose-managed PostgreSQL and Redis
containers:

```sh
pnpm dev:infra:down
```

After Kubernetes development, stop the kind node while preserving the cluster,
manifests, Secret, and local persistent volume:

```sh
pnpm kind:down
```

If both environments were used during the session, run both shutdown commands:

```sh
pnpm dev:infra:down
pnpm kind:down
```

Confirm that no Shortly containers remain active:

```sh
docker ps --filter name=shortly
```

There is no need to stop the Docker daemon manually before shutting down Fedora.
Do not use `kind delete cluster --name shortly` unless the intention is to erase
and recreate the local Kubernetes cluster.

## Full Docker stack

This runs PostgreSQL, Redis, migrations, the API, Kong, and the built frontend in Docker.
Stop host development servers first.

The built frontend sends backend requests through NGINX → Kong → API.
Kong uses the same local rate-limit policy as kind; Nx development bypasses it.

```sh
pnpm run stack:up
pnpm run stack:status
```

To rebuild images after source changes and wait for readiness:

```sh
docker compose --env-file .env --file infrastructure/local/compose.yaml up -d --build --wait
```

Open `http://localhost:4200` with the default ports. Inspect logs or stop the stack:

```sh
docker compose --env-file .env --file infrastructure/local/compose.yaml logs --tail=100 -f api web
pnpm run stack:down
```

`stack:down` retains the PostgreSQL named volume. Avoid adding `--volumes` unless
you intend to erase the local database. The migration container exiting with code
0 is expected; it is a one-time job.

For gateway checks through the **web port**, configuration reload instructions,
redirect checks, and `429` troubleshooting, see
[the Kubernetes testing guide](infrastructure/kubernetes/README.md).
The isolated full-stack regression check is:

```sh
bash infrastructure/container-tests/application-stack.sh
```

It uses a separate test project and deletes only that project's disposable
database volume when finished. Kong's Compose configuration is baked into its
image, so rebuild after editing `infrastructure/local/kong.yaml`.

## Checks before committing

```sh
pnpm format:check
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

## CI and security gates

Pull requests and pushes targeting `staging` or `main` run the workflow in
`.github/workflows/ci.yml`. The container-image jobs begin only after every
quality, integration, and security gate succeeds.

```text
quality checks ─────────────┐
PostgreSQL + Redis tests ───┤
secret scan ────────────────┼──> build API and web images ──> Trivy + SBOM
dependency review ──────────┤
CodeQL ─────────────────────┘
```

The required checks are:

- `Quality / affected` — formatting plus affected lint, typecheck, tests, and builds.
- `Integration / PostgreSQL + Redis` — migrations and real service integration tests.
- `Security / secrets` — hard-coded secret detection across Git history.
- `Security / dependency review` — newly introduced high or critical dependency risk.
- `Security / CodeQL` — JavaScript and TypeScript static analysis.
- `Images / API` and `Images / Web` — runtime image construction and scanning.

Trivy blocks every critical image vulnerability and every fixable high or
critical vulnerability. Unfixed high findings are reported without blocking.
The workflow retains compact reports and CycloneDX software bills of materials
for 14 days; it does not publish images or upload image archives.

Run the quality side locally with:

```sh
pnpm install --frozen-lockfile
pnpm exec prisma generate --config prisma7.config.ts
pnpm format:check
pnpm run lint --skip-nx-cache
pnpm run typecheck --skip-nx-cache
pnpm run test --skip-nx-cache
pnpm run build --skip-nx-cache
```

For the integration gate, start PostgreSQL and Redis, use a dedicated migrated
database through `DATABASE_URL_TEST`, set `REDIS_URL_TEST` to the host Redis
address, then run `pnpm test:integration`. Never use a production database.

GitHub Actions passing only proves that the configured checks completed. In
particular, a successful CodeQL job means analysis was uploaded successfully;
repository code-scanning rules determine whether individual alerts block a
merge.

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
`DATABASE_URL_TEST` and Redis configured through `REDIS_URL_TEST`. They create
and delete test records and cache keys; never point either URL at production.
With both test services prepared, run:

```sh
pnpm test:integration
```
