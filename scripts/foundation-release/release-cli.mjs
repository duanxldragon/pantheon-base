import path from 'node:path';
import process from 'node:process';

export const DEFAULT_ROOT = process.cwd();

const RELEASE_OPTION_HANDLERS = {
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

function requireOptionValue(flag, value) {
  if (!value) {
    throw new Error(`${flag} requires a value`);
  }

  return value;
}

export function parseReleaseArgs(argv) {
  const options = {
    root: DEFAULT_ROOT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const handler = RELEASE_OPTION_HANDLERS[arg];
    if (!handler) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    index += handler(options, argv[index + 1]);
  }

  return options;
}

export function buildReleaseHelp(scriptName) {
  return `Usage:
  node scripts/foundation-release/${scriptName} --release-version <version> --release-line <line> --base-commit <sha> [options]

Options:
  --root <path>
  --release-version <version>
  --release-line <line>
  --base-commit <sha>
  --release-notes <text>
  --upgrade-notes <text>
  --consumer-impact <text>`;
}
