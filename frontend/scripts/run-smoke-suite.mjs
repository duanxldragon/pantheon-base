import { spawn } from 'node:child_process';
import process from 'node:process';

function readArg(flag, fallback = '') {
  const index = process.argv.indexOf(flag);
  if (index < 0 || index + 1 >= process.argv.length) {
    return fallback;
  }
  return process.argv[index + 1];
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

function spawnChild(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      resolve({ code: code ?? 0, signal: signal ?? null });
    });
  });
}

const port = readArg('--port', '5173');
const host = readArg('--host', '127.0.0.1');
const config = readArg('--config');
const timeoutMs = Number(readArg('--timeout', '60000'));
const proxyTarget = readArg('--proxy-target');
const setupScript = readArg('--setup');
const playwrightCli = readArg('--playwright-cli', './node_modules/playwright/cli.js');
const playwrightSubcommand = readArg('--playwright-subcommand', 'test');
const separatorIndex = process.argv.indexOf('--');
const testArgs = separatorIndex >= 0 ? process.argv.slice(separatorIndex + 1) : [];
const webBaseUrl = `http://${host}:${port}`;

if (!config) {
  throw new Error('--config is required');
}

const serverArgs = ['scripts/start-smoke-vite.mjs', '--host', host, '--port', port];
if (setupScript) {
  serverArgs.push('--setup', setupScript);
}
if (proxyTarget) {
  serverArgs.push('--proxy-target', proxyTarget);
}

const server = spawn(process.execPath, serverArgs, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PANTHEON_EXTERNAL_WEB_SERVER: '1',
    PANTHEON_WEB_BASE_URL: webBaseUrl,
  },
  stdio: 'inherit',
  shell: false,
});

let shuttingDown = false;
async function stopServer() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  if (server.exitCode !== null) {
    return;
  }
  server.kill('SIGTERM');
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (server.exitCode === null) {
        server.kill('SIGKILL');
      }
    }, 5000);
    server.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  process.on(signal, async () => {
    await stopServer();
    process.exit(130);
  });
}

try {
  server.once('error', async (error) => {
    console.error(error);
    await stopServer();
    process.exit(1);
  });
  await waitForHttp(`http://${host}:${port}`, timeoutMs);
  const result = await spawnChild(process.execPath, [playwrightCli, playwrightSubcommand, ...testArgs, '--config', config], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PANTHEON_EXTERNAL_WEB_SERVER: '1',
      PANTHEON_WEB_BASE_URL: webBaseUrl,
    },
  });
  await stopServer();
  process.exit(result.code ?? (result.signal ? 1 : 0));
} catch (error) {
  console.error(error);
  await stopServer();
  process.exit(1);
}
