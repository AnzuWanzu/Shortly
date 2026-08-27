import request from 'supertest';
import { createApp } from './app';

const webOrigin = 'http://localhost:4200';
const app = createApp({ webOrigin });

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
