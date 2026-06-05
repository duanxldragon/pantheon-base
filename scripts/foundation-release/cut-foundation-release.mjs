import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { createReleaseManifest } from './build-release-manifest.mjs';
import { createReleaseBundle } from './build-release-bundle.mjs';
import { buildReleaseHelp, parseReleaseArgs } from './release-cli.mjs';

function printHelp() {
  console.log(buildReleaseHelp('cut-foundation-release.mjs'));
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
    options = parseReleaseArgs(process.argv.slice(2));
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
