import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { buildReleaseHelp, parseReleaseArgs } from './release-cli.mjs';

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
  if (!/^[0-9a-f]{40}$/i.test(options.baseCommit)) {
    throw new Error('base-commit must be a 40-character hex commit');
  }
}

function writeTextFile(filePath, content) {
  fs.writeFileSync(filePath, `${content.trim()}\n`, 'utf8');
}

function buildManifest(options) {
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
        'frontend/src/components',
        'frontend/src/core',
        'frontend/src/store',
        'frontend/src/modules/auth',
        'frontend/src/modules/lowcode',
        'frontend/src/modules/platform',
        'frontend/src/modules/system',
        'frontend/src/index.css',
      ],
      docs: ['docs/designs/FOUNDATION_RELEASE_MODEL.md', 'docs/designs/WORKFLOW.md'],
    },
    verification: {
      summaryFile: 'verification-summary.json',
      requiredChecks: [],
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
    requiredChecks: [],
  };
}

export function createReleaseManifest(options) {
  validateOptions(options);

  const releaseRoot = path.join(options.root, 'releases', options.releaseVersion);
  fs.mkdirSync(releaseRoot, { recursive: true });

  const manifest = buildManifest(options);
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
