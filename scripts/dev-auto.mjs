#!/usr/bin/env node
import { spawn } from 'node:child_process';
import net from 'node:net';

const tryPort = (port) => new Promise((resolve) => {
  const server = net.createServer();
  server.once('error', () => resolve(false));
  server.once('listening', () => {
    server.close(() => resolve(true));
  });
  server.listen(port, '0.0.0.0');
});

const pickPort = async () => {
  if (await tryPort(9002)) return 9002;
  if (await tryPort(9010)) return 9010;
  return 0;
};

const port = await pickPort();
if (!port) {
  console.error('No hay puertos disponibles (9002/9010). Libera alguno e intenta nuevamente.');
  process.exit(1);
}

console.log(`Iniciando Next.js en puerto ${port}...`);
const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', port === 9002 ? 'dev' : 'dev:9010'], {
  stdio: 'inherit',
  shell: false
});

child.on('exit', (code) => process.exit(code ?? 0));
