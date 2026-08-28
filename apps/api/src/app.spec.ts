import request from 'supertest';
import { createApp } from './app';

const webOrigin = 'http://localhost:4200';
const alwaysAvailableDatabase = async () => undefined;
const app = createApp({
  webOrigin,
  checkDatabase: alwaysAvailableDatabase,
});

describe('GET /health', () => {
  it('returns the service health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('CORS', () => {
  it('allows the configured web origin', async () => {
    const response = await request(app).get('/health').set('Origin', webOrigin);

    expect(response.headers['access-control-allow-origin']).toBe(webOrigin);
  });

  it('does not grant browser access to another origin', async () => {
    const untrustedOrigin = 'https://evil.example';

    const response = await request(app)
      .get('/health')
      .set('Origin', untrustedOrigin);

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).not.toBe(
      untrustedOrigin,
    );
    expect(response.headers['access-control-allow-origin']).not.toBe('*');
  });
});

describe('security headers', () => {
  it('does not advertise Express', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('prevents content-type sniffing', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('request body limits', () => {
  it('rejects JSON bodies larger than 10 KB', async () => {
    const oversizedBody = {
      content: 'x'.repeat(11 * 1024),
    };

    const response = await request(app).post('/health').send(oversizedBody);

    expect(response.status).toBe(413);
  });
});

describe('GET /ready', () => {
  it('returns ready when the database check succeeds', async () => {
    const databaseAvailable = async () => undefined;

    const readyApp = createApp({
      webOrigin,
      checkDatabase: databaseAvailable,
    });

    const response = await request(readyApp).get('/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ready' });
  });
  it('returns not ready when the database check fails', async () => {
    const databaseUnavailable = async () => {
      throw new Error('Database unavailable');
    };

    const unavailableApp = createApp({
      webOrigin,
      checkDatabase: databaseUnavailable,
    });

    const response = await request(unavailableApp).get('/ready');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'not_ready' });
  });
});
