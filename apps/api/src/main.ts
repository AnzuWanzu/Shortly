/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { createApp } from './app';
import { parseEnv } from './config/env';

const { PORT: port, WEB_ORIGIN: webOrigin } = parseEnv(process.env);
const app = createApp({ webOrigin });

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});

server.on('error', console.error);
