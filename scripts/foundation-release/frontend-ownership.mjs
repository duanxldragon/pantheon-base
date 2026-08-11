import fs from 'node:fs';
import path from 'node:path';

const requiredFrontendEntries = [
  'frontend/src/App.tsx',
  'frontend/src/main.tsx',
  'frontend/src/vite-env.d.ts',
  'frontend/src/api',
  'frontend/src/hooks',
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
