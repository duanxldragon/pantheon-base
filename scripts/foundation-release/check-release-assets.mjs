import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { validateReleaseIdentity } from './release-cli.mjs';
import {
  isMissingGitHubReleaseError,
  validateReleaseAssetChecksum,
} from './publish-foundation-release.mjs';

// A foundation release is only consumable when its published assets are
// complete. pantheon-ops materializes a release from repo.tar + the bundle
// archive, both verified by SHA-256, so a release that is missing any of these
// four assets silently breaks every consumer that pins it.
//
// v0.14.0, v0.15.0 and v0.16.0 were published with zero assets while CI stayed
// green, because nothing asserted that a release actually carries its
// artifacts. This check exists to make that class of failure impossible to
// miss.

const DEFAULT_ROOT = process.cwd();
const DEFAULT_DIST_RELATIVE = path.join('dist', 'foundation-releases');
const CHECKSUM_SUFFIX = '.sha256';
const DEFAULT_WAIT_SECONDS = 0;
const DEFAULT_POLL_SECONDS = 30;

export function requiredReleaseAssetNames(releaseVersion) {
  const archiveName = `foundation-release-${releaseVersion}.tgz`;
  return [archiveName, `${archiveName}${CHECKSUM_SUFFIX}`, 'repo.tar', `repo.tar${CHECKSUM_SUFFIX}`];
}

export function evaluateReleaseAssets({ releaseVersion, assetNames }) {
  const required = requiredReleaseAssetNames(releaseVersion);
  const present = new Set((assetNames ?? []).map((name) => String(name)));
  const missing = required.filter((name) => !present.has(name));

  return { ok: missing.length === 0, required, missing };
}

export function verifyLocalBundle(distRoot, releaseVersion) {
  const versionRoot = path.join(distRoot, releaseVersion);
  const findings = [];
  const verified = [];

  if (!fs.existsSync(versionRoot)) {
    return { ok: false, present: false, findings: [`local bundle directory is missing: ${versionRoot}`], verified };
  }

  for (const assetName of requiredReleaseAssetNames(releaseVersion)) {
    if (assetName.endsWith(CHECKSUM_SUFFIX)) {
      continue;
    }
    const archivePath = path.join(versionRoot, assetName);
    const checksumPath = `${archivePath}${CHECKSUM_SUFFIX}`;
    if (!fs.existsSync(archivePath)) {
      findings.push(`missing local asset: ${assetName}`);
      continue;
    }
    if (!fs.existsSync(checksumPath)) {
      findings.push(`missing local checksum: ${assetName}${CHECKSUM_SUFFIX}`);
      continue;
    }
    try {
      validateReleaseAssetChecksum({ archivePath, checksumPath });
      verified.push(assetName);
    } catch (error) {
      findings.push(error.message);
    }
  }

  return { ok: findings.length === 0, present: true, findings, verified };
}

function ghJson(root, args, description) {
  try {
    return JSON.parse(
      execFileSync('gh', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }),
    );
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr).trim() : '';
    throw new Error(`${description} failed${stderr ? `: ${stderr}` : ''}`);
  }
}

export function resolveRepoFullName(root, explicitRepoFullName) {
  if (explicitRepoFullName) {
    const [owner, repo] = String(explicitRepoFullName).trim().split('/');
    if (!owner || !repo) {
      throw new Error(`invalid repo full name: ${explicitRepoFullName}`);
    }
    return explicitRepoFullName;
  }
  const payload = ghJson(root, ['repo', 'view', '--json', 'nameWithOwner'], 'gh repo view');
  if (!payload?.nameWithOwner) {
    throw new Error('unable to resolve GitHub repository nameWithOwner');
  }
  return payload.nameWithOwner;
}

export function fetchReleaseAssetNames({ root, repoFullName, tagName }) {
  const payload = ghJson(
    root,
    ['release', 'view', tagName, '--repo', repoFullName, '--json', 'assets'],
    `gh release view ${tagName}`,
  );
  return (payload?.assets ?? []).map((asset) => asset.name);
}

export async function checkReleaseAssets(options) {
  const {
    root = DEFAULT_ROOT,
    releaseVersion,
    repoFullName: explicitRepoFullName,
    distRoot,
    waitSeconds = DEFAULT_WAIT_SECONDS,
    pollSeconds = DEFAULT_POLL_SECONDS,
    skipLocal = false,
    localOnly = false,
    sleep = defaultSleep,
    log = console.log,
    fetchAssetNames = fetchReleaseAssetNames,
    resolveRepo = resolveRepoFullName,
  } = options;

  validateReleaseIdentity(releaseVersion);
  const tagName = releaseVersion;
  const resolvedDistRoot = distRoot ?? path.join(root, DEFAULT_DIST_RELATIVE);

  if (!skipLocal) {
    const local = verifyLocalBundle(resolvedDistRoot, releaseVersion);
    if (local.present) {
      if (!local.ok) {
        log(`[FAIL] local bundle ${releaseVersion} is incomplete:`);
        for (const finding of local.findings) {
          log(`  - ${finding}`);
        }
        return 1;
      }
      log(`[ok] local bundle ${releaseVersion}: ${local.verified.join(', ')}`);
    } else if (localOnly) {
      log(`[FAIL] local bundle ${releaseVersion} is missing at ${resolvedDistRoot}`);
      return 1;
    } else {
      log(`[skip] no local bundle directory at ${resolvedDistRoot}/${releaseVersion}`);
    }
  } else if (localOnly) {
    throw new Error('--local-only cannot be combined with --skip-local');
  }

  if (localOnly) {
    return 0;
  }

  const repoFullName = resolveRepo(root, explicitRepoFullName);
  const deadline = Date.now() + Math.max(0, waitSeconds) * 1000;
  let lastProblem = `release ${tagName} has not been verified yet`;

  for (;;) {
    let evaluation = null;
    try {
      evaluation = evaluateReleaseAssets({
        releaseVersion,
        assetNames: fetchAssetNames({ root, repoFullName, tagName }),
      });
    } catch (error) {
      if (!isMissingGitHubReleaseError(error)) {
        throw error;
      }
      lastProblem = `release ${tagName} does not exist in ${repoFullName}`;
    }

    if (evaluation?.ok) {
      log(`[ok] release ${tagName} carries all ${evaluation.required.length} required assets:`);
      for (const assetName of evaluation.required) {
        log(`  - ${assetName}`);
      }
      return 0;
    }

    if (evaluation) {
      lastProblem = `release ${tagName} is missing assets: ${evaluation.missing.join(', ')}`;
    }

    if (Date.now() >= deadline) {
      break;
    }
    log(`[wait] ${lastProblem}; retrying in ${pollSeconds}s`);
    await sleep(pollSeconds * 1000);
  }

  log(`[FAIL] ${lastProblem}`);
  return 1;
}

function defaultSleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function parseCheckArgs(argv) {
  const options = { root: DEFAULT_ROOT };

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
    } else if (arg === '--repo') {
      if (!value) throw new Error('--repo requires a value');
      options.repoFullName = value;
      index += 1;
    } else if (arg === '--dist') {
      if (!value) throw new Error('--dist requires a path');
      options.distRoot = path.resolve(value);
      index += 1;
    } else if (arg === '--wait') {
      const seconds = Number(value);
      if (!Number.isFinite(seconds) || seconds < 0) {
        throw new Error('--wait requires a non-negative number of seconds');
      }
      options.waitSeconds = seconds;
      index += 1;
    } else if (arg === '--poll') {
      const seconds = Number(value);
      if (!Number.isFinite(seconds) || seconds <= 0) {
        throw new Error('--poll requires a positive number of seconds');
      }
      options.pollSeconds = seconds;
      index += 1;
    } else if (arg === '--skip-local') {
      options.skipLocal = true;
    } else if (arg === '--local-only') {
      options.localOnly = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp(log) {
  log(`Usage:
  node scripts/foundation-release/check-release-assets.mjs --release-version <version> [options]

Verifies that a foundation release carries its complete, checksum-consistent
artifact set: the bundle archive, its .sha256, repo.tar and repo.tar.sha256.

Options:
  --release-version <version>  pantheon-base-vX.Y.Z (required)
  --repo <owner/repo>          defaults to the current gh repository
  --dist <path>                local dist root (default dist/foundation-releases)
  --wait <seconds>             poll until assets appear (default 0)
  --poll <seconds>             polling interval (default 30)
  --skip-local                 skip local bundle verification
  --local-only                 verify only the local bundle, never GitHub
  --root <path>`);
}

export async function runCheckCli(argv, { log = console.log } = {}) {
  const options = parseCheckArgs(argv);
  if (options.help) {
    printHelp(log);
    return 0;
  }
  if (!options.releaseVersion) {
    throw new Error('--release-version is required');
  }
  return checkReleaseAssets({ ...options, log });
}

async function main() {
  return runCheckCli(process.argv.slice(2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(error.message);
      process.exitCode = 1;
    },
  );
}
