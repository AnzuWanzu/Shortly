/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import app from './app';
import { parseEnv } from './config/env';

const { PORT: port } = parseEnv(process.env);
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});

server.on('error', console.error);
