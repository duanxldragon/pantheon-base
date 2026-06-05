import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = process.cwd();
const HELP_TEXT = `Usage:
  node scripts/foundation-release/build-release-manifest.mjs --release-version <version> --release-line <line> --base-commit <sha> [options]

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
    qualityBaselines: {
      sonarProjectVersion: options.releaseVersion,
    },
    bundleExclusions: ['backend/cmd/server/uploads', 'backend/uploads', 'uploads'],
    sharedPaths: {
      backend: ['backend/cmd', 'backend/internal', 'backend/modules', 'backend/pkg'],
      frontend: ['frontend/src/core', 'frontend/src/components', 'frontend/src/modules/system'],
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
  console.log(HELP_TEXT);
}

function main() {
  let options;

  try {
    options = parseArgs(process.argv.slice(2));
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
