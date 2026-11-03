import assert from 'node:assert/strict';
import { setTimeout as pause } from 'node:timers/promises';

// Only application-stack.sh should run this against its disposable database.
assert.equal(process.env.SHORTLY_DISPOSABLE_STACK, '1');
const base = 'http://127.0.0.1:14200';
const credentials = {
  email: 'gateway-test@example.com',
  password: 'gateway-test-password',
  displayName: 'Gateway test',
};

async function request(path, status, options = {}) {
  // Keep functional assertions separate from the intentional rate-limit burst.
  await pause(1100);
  const response = await fetch(`${base}${path}`, {
    ...options,
    redirect: 'manual',
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.status, status, `${path}: unexpected HTTP status`);
  assert.match(response.headers.get('via') ?? '', /kong\//i);
  return response;
}

const jsonHeaders = {
  'content-type': 'application/json',
  'x-shortly-csrf': '1',
};

await request('/ready', 200);
await request('/auth/me', 401);
await request('/links', 401);
await request('/auth/register', 201, {
  method: 'POST',
  headers: jsonHeaders,
  body: JSON.stringify(credentials),
});
const login = await request('/auth/login', 200, {
  method: 'POST',
  headers: jsonHeaders,
  body: JSON.stringify({
    email: credentials.email,
    password: credentials.password,
  }),
});
const setCookie = login.headers.get('set-cookie');
assert.match(setCookie ?? '', /shortly_session=/);
assert.match(setCookie, /HttpOnly/i);
const cookie = setCookie.split(';')[0];
const me = await request('/auth/me', 200, { headers: { cookie } });
assert.equal((await me.json()).user.email, credentials.email);

const destination = 'https://example.com/articles/42?source=gateway';
const created = await request('/links', 201, {
  method: 'POST',
  headers: { ...jsonHeaders, cookie },
  body: JSON.stringify({ originalUrl: destination }),
});
const { link } = await created.json();
const redirected = await request(`/r/${link.slug}`, 302);
assert.equal(redirected.headers.get('location'), destination);

await pause(1100);
const responses = await Promise.all(
  Array.from({ length: 30 }, () =>
    fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) }),
  ),
);
const statuses = responses.map((response) => response.status);
assert.ok(statuses.includes(200), 'Burst should include successful forwarding');
assert.ok(statuses.includes(429), 'Burst should trigger the gateway limit');
assert.ok(statuses.every((status) => status === 200 || status === 429));
for (const response of responses) {
  if (response.status === 429) {
    assert.ok(Number(response.headers.get('retry-after')) > 0);
  }
  await response.arrayBuffer();
}
await request('/health', 200);
console.log(
  'Gateway flow passed: auth, cookies, CSRF, links, 302, 429, recovery.',
);
console.log('Burst statuses:', statuses.join(' '));
