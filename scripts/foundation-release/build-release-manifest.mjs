import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  buildReleaseHelp,
  parseReleaseArgs,
  resolveRequiredChecks,
  validateReleaseIdentity,
} from './release-cli.mjs';
import { assertSharedFrontendOwnership } from './frontend-ownership.mjs';

function validateOptions(options) {
  if (options.help) {
    return;
  }

  if (!options.releaseVersion) {
    throw new Error('release-version is required');
  }
  if (!options.releaseLine) {
    throw new Error('release-line is required');
  }
  if (!options.baseCommit) {
    throw new Error('base-commit is required');
  }
  validateReleaseIdentity(options.releaseVersion, options.releaseLine);
  if (!/^[0-9a-f]{40}$/i.test(options.baseCommit)) {
    throw new Error('base-commit must be a 40-character hex commit');
  }
}

function writeTextFile(filePath, content) {
  fs.writeFileSync(filePath, `${content.trim()}\n`, 'utf8');
}

function buildManifest(options) {
  const requiredChecks = resolveRequiredChecks(options.requiredChecks);
  return {
    schemaVersion: 1,
    releaseVersion: options.releaseVersion,
    releaseLine: options.releaseLine,
    baseCommit: options.baseCommit,
    createdAt: new Date().toISOString(),
    sourceRepo: 'pantheon-base',
    consumerMode: 'foundation-release-consumer',
    releaseArtifact: {
      assetName: `foundation-release-${options.releaseVersion}.tgz`,
    },
    bundleExclusions: ['backend/cmd/server/uploads', 'backend/uploads', 'uploads'],
    sharedPaths: {
      backend: ['backend/cmd', 'backend/internal', 'backend/modules', 'backend/pkg'],
      frontend: [
        'frontend/src/App.tsx',
        'frontend/src/main.tsx',
        'frontend/src/vite-env.d.ts',
        'frontend/src/api',
        'frontend/src/hooks',
        'frontend/src/components',
        'frontend/src/core',
        'frontend/src/store',
        'frontend/src/modules/auth',
        'frontend/src/modules/lowcode',
        'frontend/src/modules/platform',
        'frontend/src/modules/system',
        'frontend/src/index.css',
        'frontend/scripts/export-generated-module.mjs',
        'frontend/scripts/lib/auth-cookie-session.mjs',
        'frontend/scripts/lib/css-declarations.mjs',
        'frontend/scripts/run-smoke-suite.mjs',
        'frontend/scripts/run-smoke-suite.test.mjs',
        'frontend/scripts/test-fixtures/bind-ready-server.mjs',
        'frontend/scripts/test-fixtures/fake-playwright-cli.mjs',
        'frontend/scripts/test-fixtures/record-cleanup.mjs',
        'frontend/scripts/transpile-typescript-files.mjs',
        'frontend/tests/fixtures/coverage.ts',
        'frontend/tests/smoke/helpers/auth.ts',
        'frontend/tests/smoke/helpers/fixture-policy.ts',
        'frontend/tests/smoke/helpers/shared-read-cache.ts',
        'frontend/tests/smoke/helpers/url-pattern.ts',
        'frontend/tests/smoke/platform/shell-visual-contract.spec.ts',
        'frontend/tests/smoke/system/system-pages.spec.ts',
        'frontend/tests/smoke/system/system-workspace-task-depth.ts',
      ],
      docs: ['docs/designs/FOUNDATION_RELEASE_MODEL.md', 'docs/designs/WORKFLOW.md'],
    },
    verification: {
      summaryFile: 'verification-summary.json',
      requiredChecks,
    },
    consumerCompatibility: {
      'pantheon-ops': {
        minimumCurrentRelease: options.releaseLine,
        notesFile: 'consumer-impact.md',
      },
    },
  };
}

function buildVerificationSummary(options) {
  return {
    releaseVersion: options.releaseVersion,
    releaseLine: options.releaseLine,
    baseCommit: options.baseCommit,
    generatedAt: new Date().toISOString(),
    requiredChecks: resolveRequiredChecks(options.requiredChecks),
  };
}

export function createReleaseManifest(options) {
  validateOptions(options);

  const releaseRoot = path.join(options.root, 'releases', options.releaseVersion);
  fs.mkdirSync(releaseRoot, { recursive: true });

  const manifest = buildManifest(options);
  assertSharedFrontendOwnership(options.root, manifest.sharedPaths.frontend);
  const verificationSummary = buildVerificationSummary(options);

  fs.writeFileSync(path.join(releaseRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(
    path.join(releaseRoot, 'verification-summary.json'),
    `${JSON.stringify(verificationSummary, null, 2)}\n`,
    'utf8',
  );

  writeTextFile(
    path.join(releaseRoot, 'release-notes.md'),
    `# Release Notes\n\n${options.releaseNotes || 'No release notes provided.'}`,
  );
  writeTextFile(
    path.join(releaseRoot, 'upgrade-notes.md'),
    `# Upgrade Notes\n\n${options.upgradeNotes || 'No upgrade notes provided.'}`,
  );
  writeTextFile(
    path.join(releaseRoot, 'consumer-impact.md'),
    `# Consumer Impact\n\n${options.consumerImpact || 'No consumer impact summary provided.'}`,
  );

  return {
    releaseRoot,
    manifest,
    verificationSummary,
  };
}

function printHelp() {
  console.log(buildReleaseHelp('build-release-manifest.mjs'));
}

function main() {
  let options;

  try {
    options = parseReleaseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return 0;
    }
    createReleaseManifest(options);
    return 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exitCode = main();
}
