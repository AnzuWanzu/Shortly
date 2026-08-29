import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../../src/app';
import { composeLogin } from '../../src/auth/login/login-composition';
import { composeRegistration } from '../../src/auth/registration/registration-composition';
import { composeSession } from '../../src/auth/session-composition';
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '../../src/auth/session-router';
import { createPrismaClient } from '../../src/database/prisma';
import { composeLinks } from '../../src/links/link-composition';

const databaseUrl = process.env['DATABASE_URL_TEST'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL_TEST is required for API integration tests');
}

const prisma = createPrismaClient(databaseUrl);
const authDependencies = {
  ...composeRegistration(prisma),
  ...composeLogin(prisma),
  ...composeSession(prisma),
};
const app = createApp({
  webOrigin: 'http://localhost:4200',
  checkDatabase: async () => undefined,
  ...authDependencies,
  secureCookies: false,
  linkDependencies: composeLinks(prisma),
});
const createdEmails = new Set<string>();

afterEach(async () => {
  if (createdEmails.size === 0) {
    return;
  }

  await prisma.user.deleteMany({
    where: { email: { in: [...createdEmails] } },
  });
  createdEmails.clear();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function createLoggedInUser(label: string) {
  const emailLabel = label.toLowerCase().replace(/ /g, '-');
  const email = `${emailLabel}-${randomUUID()}@shortly.test`;
  const password = 'correct horse battery staple';
  createdEmails.add(email.toLowerCase());

  const registrationResponse = await request(app).post('/auth/register').send({
    email,
    displayName: label,
    password,
  });
  expect(registrationResponse.status).toBe(201);

  const user: { id: string } = registrationResponse.body.user;
  const agent = request.agent(app);
  const loginResponse = await agent
    .post('/auth/login')
    .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
    .send({ email, password });

  expect(loginResponse.status).toBe(200);
  return { agent, user };
}

describe('server-side link ownership', () => {
  it('prevents one authenticated user from seeing or deleting another user’s link', async () => {
    const owner = await createLoggedInUser('Owner');
    const otherUser = await createLoggedInUser('Other User');

    const createResponse = await owner.agent
      .post('/links')
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ originalUrl: 'https://example.com/owned-by-user-a' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.link.userId).toBe(owner.user.id);
    const linkId: string = createResponse.body.link.id;

    const otherUserList = await otherUser.agent.get('/links');
    expect(otherUserList.status).toBe(200);
    expect(otherUserList.body.links).toEqual([]);

    const crossUserDelete = await otherUser.agent
      .delete(`/links/${linkId}`)
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE);
    expect(crossUserDelete.status).toBe(404);
    await expect(prisma.link.count({ where: { id: linkId } })).resolves.toBe(1);

    const ownerDelete = await owner.agent
      .delete(`/links/${linkId}`)
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE);
    expect(ownerDelete.status).toBe(204);
    await expect(prisma.link.count({ where: { id: linkId } })).resolves.toBe(0);
  });
});
