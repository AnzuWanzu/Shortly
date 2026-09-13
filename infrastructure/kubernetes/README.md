# Testing Shortly on Kubernetes

These commands verify the local `kind-shortly` cluster and workloads in the
`shortly` namespace.

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

Expected: `HTTP/1.1 200 OK` with a `Server: kong/...` header.

Test the five-request-per-second limit:

```bash
sleep 1

for request in {1..7}; do
  curl --silent \
    --output /dev/null \
    --write-out "%{http_code}\n" \
    http://localhost:8000/health
done
```

Expected shape:

```text
200
200
200
200
200
429
429
```

The number of initial `200` responses may be lower if another request was
counted in the same second. A `429` proves Kong enforced the limit.

## Web and NGINX

```bash
kubectl port-forward --namespace shortly service/web 4200:8080
```

Open `http://localhost:4200`, or test:

```bash
curl --include http://localhost:4200/
curl --include http://localhost:4200/health
curl --include http://localhost:4200/ready
```

The first request should return React. Backend paths should travel through
NGINX and the configured gateway path.

Stop any port-forward with `Ctrl+C`.

## Service routing and logs

```bash
kubectl get endpointslice --namespace shortly
kubectl describe deployment/kong --namespace shortly
kubectl logs deployment/kong --namespace shortly
```

Replace `kong` with `api`, `web`, `redis`, or `postgres` when needed.

## Common results

| Result             | Meaning                             | First check                         |
| ------------------ | ----------------------------------- | ----------------------------------- |
| `000`              | No HTTP connection was established  | Confirm the port-forward is running |
| `404` from Kong    | No Kong Route matched               | Check `kong/config-map.yaml` paths  |
| `426` from Kong    | The matched Route requires HTTPS    | Confirm it explicitly allows `http` |
| `429` from Kong    | Rate limit was enforced             | Expected during the limit test      |
| `503`              | No ready upstream                   | Check Pods and EndpointSlices       |
| `CrashLoopBackOff` | Container repeatedly exits          | Read current and previous logs      |
| `OOMKilled`        | Container exceeded its memory limit | Check limits and Kong worker count  |

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
