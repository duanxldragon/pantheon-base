import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = process.cwd();
const RELEASE_VERSION_PATTERN = /^base-v(\d+)\.(\d+)\.(\d+)$/;

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
    } else if (arg === '--default') {
      if (!value) throw new Error('--default requires a value');
      options.defaultVersion = value.trim();
      index += 1;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function parseReleaseVersion(version) {
  const match = RELEASE_VERSION_PATTERN.exec(version);
  if (!match) {
    return null;
  }

  return match.slice(1).map((value) => Number.parseInt(value, 10));
}

function compareReleaseVersions(left, right) {
  const leftParts = parseReleaseVersion(left);
  const rightParts = parseReleaseVersion(right);

  if (!leftParts && !rightParts) {
    return left.localeCompare(right);
  }
  if (!leftParts) {
    return -1;
  }
  if (!rightParts) {
    return 1;
  }

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index];
    }
  }

  return 0;
}

function resolveFromEnvironment() {
  const projectVersion = process.env.PANTHEON_SONAR_PROJECT_VERSION?.trim();
  if (!projectVersion) {
    return null;
  }

  return {
    projectVersion,
    source: 'env',
  };
}

function resolveFromReleaseManifest(root) {
  const releasesRoot = path.join(root, 'releases');
  if (!fs.existsSync(releasesRoot)) {
    return null;
  }

  const versions = fs
    .readdirSync(releasesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((entry) => fs.existsSync(path.join(releasesRoot, entry, 'manifest.json')))
    .sort(compareReleaseVersions);

  const projectVersion = versions.at(-1);
  if (!projectVersion) {
    return null;
  }

  return {
    projectVersion,
    source: 'release-manifest',
  };
}

function resolveFromDefault(options) {
  if (!options.defaultVersion) {
    return null;
  }

  return {
    projectVersion: options.defaultVersion,
    source: 'default',
  };
}

export function resolveSonarProjectVersion(options = {}) {
  const normalizedOptions = {
    root: path.resolve(options.root ?? DEFAULT_ROOT),
    defaultVersion: options.defaultVersion?.trim(),
  };

  return (
    resolveFromEnvironment() ??
    resolveFromReleaseManifest(normalizedOptions.root) ??
    resolveFromDefault(normalizedOptions)
  );
}

function printHelp() {
  console.log(`Usage:
  node scripts/foundation-release/resolve-sonar-project-version.mjs [options]

Options:
  --root <path>
  --default <version>
  --json`);
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return 0;
    }

    const result = resolveSonarProjectVersion(options);
    if (!result) {
      throw new Error(
        'Unable to resolve a Sonar project version. Cut a foundation release tag (base-v*) or set PANTHEON_SONAR_PROJECT_VERSION.',
      );
    }

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result.projectVersion);
    }

    return 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exitCode = main();
}
