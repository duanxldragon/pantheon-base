import fs from 'node:fs';
import path from 'node:path';

const requiredFrontendEntries = [
  'frontend/src/App.tsx',
  'frontend/src/main.tsx',
  'frontend/src/vite-env.d.ts',
  'frontend/src/api',
  'frontend/src/hooks',
  'frontend/package.json',
  'frontend/playwright.api.config.ts',
  'frontend/playwright.config.ts',
  'frontend/playwright.full-system.config.ts',
  'frontend/playwright.auto-recycle.config.ts',
  'frontend/playwright.many-to-many.config.ts',
  'frontend/playwright.master-detail.config.ts',
  'frontend/scripts/cleanup-generated-modules.mjs',
  'frontend/scripts/cleanup-smoke-fixtures.mjs',
  'frontend/scripts/check-smoke-web-base.mjs',
  'frontend/scripts/database-import-qa-setup.mjs',
  'frontend/scripts/lib/auth-cookie-session.mjs',
  'frontend/scripts/lib/cleanup-fixture-cache.mjs',
  'frontend/scripts/lib/cleanup-fixture-query-plan.mjs',
  'frontend/scripts/lib/cleanup-http.mjs',
  'frontend/scripts/many-to-many-qa-setup.mjs',
  'frontend/scripts/master-detail-qa-setup.mjs',
  'frontend/scripts/run-smoke-suite.mjs',
  'frontend/scripts/start-smoke-vite.mjs',
  'frontend/tests/smoke/business/generated',
  'frontend/tests/smoke/helpers',
  'frontend/tests/smoke/platform',
  'frontend/tests/smoke/system',
  'frontend/tests/smoke/README.md',
];

function normalizeRelativePath(relativePath) {
  return relativePath.replaceAll('\\', '/').replace(/\/+$/u, '');
}

export function assertSharedFrontendOwnership(root, frontendPaths = []) {
  const normalizedPaths = frontendPaths.map(normalizeRelativePath);
  const duplicatePaths = normalizedPaths.filter(
    (entry, index) => normalizedPaths.indexOf(entry) !== index,
  );
  if (duplicatePaths.length > 0) {
    throw new Error(`release manifest declares duplicate frontend paths: ${[...new Set(duplicatePaths)].join(', ')}`);
  }

  const missingEntries = requiredFrontendEntries.filter((entry) => {
    const sourcePath = path.join(root, entry);
    return fs.existsSync(sourcePath) && !normalizedPaths.includes(entry);
  });
  if (missingEntries.length > 0) {
    throw new Error(
      `release manifest leaves shared frontend sources unowned: ${missingEntries.join(', ')}`,
    );
  }
}
