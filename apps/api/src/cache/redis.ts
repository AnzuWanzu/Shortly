import { createClient } from 'redis';

type RedisErrorHandler = (error: Error) => void;

export function createRedisClient(url: string, onError: RedisErrorHandler) {
  const client = createClient({ url });

  client.on('error', onError);

  return client;
}

export type RedisClient = ReturnType<typeof createRedisClient>;
