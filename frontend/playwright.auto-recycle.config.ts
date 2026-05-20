import { defineConfig } from '@playwright/test';

const backendOrigin = process.env.PANTHEON_API_PROXY_TARGET ?? 'http://127.0.0.1:18080';
const webServerCommand = `cmd /c set PANTHEON_SMOKE=1 && set PANTHEON_API_PROXY_TARGET=${backendOrigin} && npm run dev -- --host 127.0.0.1 --port 5174`;

export default defineConfig({
  testDir: './tests/smoke',
  timeout: 180_000,
  workers: 1,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: webServerCommand,
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
