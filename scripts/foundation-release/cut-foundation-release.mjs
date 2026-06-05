import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { createReleaseManifest } from './build-release-manifest.mjs';
import { createReleaseBundle } from './build-release-bundle.mjs';

const DEFAULT_ROOT = process.cwd();
const HELP_TEXT = `Usage:
  node scripts/foundation-release/cut-foundation-release.mjs --release-version <version> --release-line <line> --base-commit <sha> [options]

Options:
  --root <path>
  --release-version <version>
  --release-line <line>
  --base-commit <sha>
  --release-notes <text>
  --upgrade-notes <text>
  --consumer-impact <text>`;

function requireOptionValue(flag, value) {
  if (!value) {
    throw new Error(`${flag} requires a value`);
  }

  return value;
}

const OPTION_HANDLERS = {
  '--root': (options, value) => {
    options.root = path.resolve(requireOptionValue('--root', value));
    return 1;
  },
  '--release-version': (options, value) => {
    options.releaseVersion = requireOptionValue('--release-version', value);
    return 1;
  },
  '--release-line': (options, value) => {
    options.releaseLine = requireOptionValue('--release-line', value);
    return 1;
  },
  '--base-commit': (options, value) => {
    options.baseCommit = requireOptionValue('--base-commit', value);
    return 1;
  },
  '--release-notes': (options, value) => {
    options.releaseNotes = requireOptionValue('--release-notes', value);
    return 1;
  },
  '--upgrade-notes': (options, value) => {
    options.upgradeNotes = requireOptionValue('--upgrade-notes', value);
    return 1;
  },
  '--consumer-impact': (options, value) => {
    options.consumerImpact = requireOptionValue('--consumer-impact', value);
    return 1;
  },
  '--help': (options) => {
    options.help = true;
    return 0;
  },
  '-h': (options) => {
    options.help = true;
    return 0;
  },
};

function parseArgs(argv) {
  const options = {
    root: DEFAULT_ROOT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const handler = OPTION_HANDLERS[arg];
    if (!handler) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    index += handler(options, argv[index + 1]);
  }

  return options;
}

function printHelp() {
  console.log(HELP_TEXT);
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
