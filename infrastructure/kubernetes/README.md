# Testing Shortly on Kubernetes

These commands verify the local `kind-shortly` cluster and workloads in the
`shortly` namespace.

Run from the repository root and confirm the context before applying manifests.
The complete built-application request path is:

```text
Fedora localhost:4200 -> web Service:8080 -> NGINX
  /login and assets -> React build
  /auth, /links, /r, /api, /health, /ready -> kong Service:8000
    -> Kong route + rate limit -> api Service:3333 -> Express
```

Kong is DB-less, with one replica and a local five-request-per-second policy.
This is a local demonstration: proxy traffic may share an IP bucket, counters
are not shared across Kong replicas, and HTTP is not production TLS.
Direct API access bypasses Kong. Nx development does not exercise this gateway.

## Start and inspect the cluster

```bash
pnpm kind:up
kubectl config current-context
kubectl get deployment,job,pod,service,pvc --namespace shortly
```

Expected context: `kind-shortly`.

If startup temporarily returns `Forbidden`, give the control plane a few
seconds, then run:

```bash
kubectl auth can-i get nodes
kubectl wait --for=condition=Ready \
  node/shortly-control-plane --timeout=120s
```

## PostgreSQL

```bash
kubectl exec --namespace shortly deployment/postgres \
  -- pg_isready -U shortly -d shortly
```

Expected: `/var/run/postgresql:5432 - accepting connections`.

Inspect the tables:

```bash
kubectl exec --stdin --tty --namespace shortly deployment/postgres \
  -- psql -U shortly -d shortly
```

Useful `psql` commands:

```text
\dt
\d public.users
\d public.links
\d public.sessions
\q
```

## Redis

```bash
kubectl exec --namespace shortly deployment/redis -- redis-cli ping
```

Expected: `PONG`.

## Prisma migration Job

```bash
kubectl get job/migrate --namespace shortly
kubectl logs job/migrate --namespace shortly
```

Expected Job status: `Complete`.

If the Job does not exist:

```bash
kubectl apply -f infrastructure/kubernetes/migration/job.yaml
kubectl wait --namespace shortly --for=condition=complete \
  job/migrate --timeout=120s
```

## API

Start a temporary tunnel:

```bash
kubectl port-forward --namespace shortly service/api 3333:3333
```

Keep that terminal running. In another terminal:

```bash
curl --include http://localhost:3333/health
curl --include http://localhost:3333/ready
```

Both should return `HTTP/1.1 200 OK`. `/health` proves Express responds;
`/ready` also proves its required database dependency is available.

## Kong

Start a temporary tunnel:

```bash
kubectl port-forward --namespace shortly service/kong 8000:8000
```

In another terminal, prove Kong routes to the API:

```bash
curl --include http://localhost:8000/health
```

Expected: `200` with `Via: ... kong/...` and rate-limit headers.
The response version string may vary. `Via` also works when an outer NGINX
server supplies its own `Server` header.

Test the five-request-per-second limit:

```bash
sleep 2
seq 1 30 | xargs -P 10 -I '{}' curl --silent --show-error --max-time 5 \
  --output /dev/null --write-out '%{http_code}\n' http://localhost:8000/health
```

Expect `200` and `429`, not a fixed order or exactly five successes. Time-window
boundaries and other traffic affect the counts. If no `429` appears, inspect
the active configuration and repeat the burst. `000` is a transport failure,
not rate limiting. After two seconds, a new request should succeed again.

## Web and NGINX

```bash
kubectl port-forward --namespace shortly service/web 4200:8080
```

Open `http://localhost:4200`, or test:

```bash
curl --include http://localhost:4200/
curl --include http://localhost:4200/login
curl --include http://localhost:4200/health
curl --include http://localhost:4200/ready
curl --include http://localhost:4200/auth/me
```

`/` and `/login` should return React HTML. Health and readiness should return
`200` JSON with Kong's `Via` and rate-limit headers. Without a session,
`/auth/me` returns `401` JSON; that is an expected API response, not a gateway
failure. Space checks apart if the five-per-second limit intervenes.

Repeat the burst through the **web port**, which proves NGINX is not bypassing Kong:

```bash
sleep 2
seq 1 30 | xargs -P 10 -I '{}' curl --silent --show-error --max-time 5 \
  --output /dev/null --write-out '%{http_code}\n' http://localhost:4200/health
sleep 2
curl --include --max-time 5 http://localhost:4200/health
```

In the browser, register/log in, create a link, and copy its slug. Inspect its
redirect without following it (replace `YOUR_SLUG`):

```bash
curl --include --max-time 5 http://localhost:4200/r/YOUR_SLUG
```

Expected: `302`, the exact destination in `Location`, and Kong's `Via` header.
Do not add `--location` if you want to inspect Shortly's response rather than
the destination website. Session cookies and `x-shortly-csrf` should survive
the proxy path; the isolated test below checks them with a real login.

Stop any port-forward with `Ctrl+C`.

## Apply changes and refresh running Pods

For Kong routing/plugin changes:

```bash
kubectl apply -f infrastructure/kubernetes/kong/config-map.yaml
kubectl apply -f infrastructure/kubernetes/kong/service.yaml
kubectl apply -f infrastructure/kubernetes/kong/deployment.yaml
kubectl rollout restart --namespace shortly deployment/kong
kubectl rollout status --namespace shortly deployment/kong --timeout=120s
```

Changing the ConfigMap alone does not reload Kong's startup configuration.
For changes to `apps/web/nginx.conf`, rebuild and load the web image:

```bash
docker build --file apps/web/Dockerfile --tag shortly-web:local .
kind load docker-image shortly-web:local --name shortly
kubectl rollout restart --namespace shortly deployment/web
kubectl rollout status --namespace shortly deployment/web --timeout=120s
```

Restart the port-forward if its selected Pod was replaced. A Service
port-forward selects a Pod; it is not proof that requests balanced across all
replicas. Inspect EndpointSlices separately for ready Pod addresses.

## Repeatable isolated gateway check

```bash
bash infrastructure/container-tests/application-stack.sh
bash infrastructure/container-tests/web-image.sh
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

The first script builds a separate Compose project, `shortly-container-test`,
using `.env.example` and ports 15432, 16379, 13333, and 14200. It registers a
test user, logs in, creates a link, verifies a `302`, triggers `429`, and checks
recovery. Its cleanup **deletes that test project's volume**. Do not reuse that
project name for data you want to keep. It does not use the kind database or
the normal `shortly-local` volume. The second script tests static serving only,
with a dummy gateway DNS entry; it does not claim to test Kong.

Compose uses `infrastructure/local/kong.yaml`; Kubernetes uses the embedded
`kong.yaml` in its ConfigMap. Keep their route/plugin settings equivalent.
After a Compose gateway config change, rebuild with `up -d --build --wait`.

## Service routing and logs

```bash
kubectl get endpointslice --namespace shortly
kubectl describe deployment/kong --namespace shortly
kubectl logs deployment/kong --namespace shortly
```

Replace `kong` with `api`, `web`, `redis`, or `postgres` when needed.

## Common results

| Result             | Meaning                                               | First check                                        |
| ------------------ | ----------------------------------------------------- | -------------------------------------------------- |
| `000`              | No HTTP response code was received                    | Read curl's error; check tunnel and timeouts       |
| `404`              | Unmatched Kong route or missing API resource          | Read response body and check path                  |
| `426` from Kong    | The matched Route requires HTTPS                      | Confirm it explicitly allows `http`                |
| `429` from Kong    | Rate limit was enforced                               | Expected during the limit test                     |
| `503`              | Gateway/upstream unavailable, or API readiness failed | Read body; check Pods, database and EndpointSlices |
| `CrashLoopBackOff` | Container repeatedly exits                            | Read current and previous logs                     |
| `OOMKilled`        | Container exceeded its memory limit                   | Check limits and Kong worker count                 |

```bash
kubectl get pods --namespace shortly
kubectl get endpointslice --namespace shortly
kubectl get events --namespace shortly --sort-by=.lastTimestamp
kubectl logs deployment/kong --namespace shortly --previous
```

## End of day

Stop port-forwards with `Ctrl+C`, then preserve and stop the kind cluster:

```bash
pnpm kind:down
```

Do not use `kind delete cluster --name shortly` unless the cluster and its local
runtime data should be discarded.
