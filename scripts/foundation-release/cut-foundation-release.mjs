import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { createReleaseManifest } from './build-release-manifest.mjs';
import { createReleaseBundle } from './build-release-bundle.mjs';

const DEFAULT_ROOT = process.cwd();

function parseArgs(argv) {
  const options = {
    root: DEFAULT_ROOT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];

    if (arg === '--root') {
      if (!value) throw new Error('--root requires a path');
      options.root = path.resolve(value);
      index += 1;
    } else if (arg === '--release-version') {
      if (!value) throw new Error('--release-version requires a value');
      options.releaseVersion = value;
      index += 1;
    } else if (arg === '--release-line') {
      if (!value) throw new Error('--release-line requires a value');
      options.releaseLine = value;
      index += 1;
    } else if (arg === '--base-commit') {
      if (!value) throw new Error('--base-commit requires a value');
      options.baseCommit = value;
      index += 1;
    } else if (arg === '--release-notes') {
      if (!value) throw new Error('--release-notes requires a value');
      options.releaseNotes = value;
      index += 1;
    } else if (arg === '--upgrade-notes') {
      if (!value) throw new Error('--upgrade-notes requires a value');
      options.upgradeNotes = value;
      index += 1;
    } else if (arg === '--consumer-impact') {
      if (!value) throw new Error('--consumer-impact requires a value');
      options.consumerImpact = value;
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  node scripts/foundation-release/cut-foundation-release.mjs --release-version <version> --release-line <line> --base-commit <sha> [options]`);
}

export function cutFoundationRelease(options) {
  const manifestResult = createReleaseManifest(options);
  const bundleResult = createReleaseBundle({
    root: options.root,
    releaseVersion: options.releaseVersion,
  });

  return {
    releaseRoot: manifestResult.releaseRoot,
    distRoot: bundleResult.distRoot,
    releaseVersion: options.releaseVersion,
  };
}

function main() {
  let options;

  try {
    options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return 0;
    }
    cutFoundationRelease(options);
    return 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exitCode = main();
}
