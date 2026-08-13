import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { validateReleaseIdentity } from './release-cli.mjs';
import { assertSharedFrontendOwnership } from './frontend-ownership.mjs';

const DEFAULT_ROOT = process.cwd();
const METADATA_FILES = [
  'manifest.json',
  'verification-summary.json',
  'release-notes.md',
  'upgrade-notes.md',
  'consumer-impact.md',
];

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
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function resolveReleaseRoots(root, releaseVersion) {
  if (!releaseVersion) {
    throw new Error('release-version is required');
  }
  validateReleaseIdentity(releaseVersion);

  const releaseRoot = path.join(root, 'releases', releaseVersion);
  const distRoot = path.join(root, 'dist', 'foundation-releases', releaseVersion);
  const bundleRoot = path.join(distRoot, 'bundle');

  return { releaseRoot, distRoot, bundleRoot };
}

function readManifest(releaseRoot) {
  const manifestPath = path.join(releaseRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest.json is missing under ${releaseRoot}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function normalizeRelativePath(relativePath) {
  return relativePath.replaceAll(path.sep, '/');
}

function isExcludedPath(relativePath, exclusions) {
  const normalizedRelativePath = normalizeRelativePath(relativePath);
  return exclusions.some((entry) => {
    const normalizedEntry = normalizeRelativePath(entry);
    return (
      normalizedRelativePath === normalizedEntry ||
      normalizedRelativePath.startsWith(`${normalizedEntry}/`)
    );
  });
}

function copyEntry(root, relativePath, targetRoot, exclusions) {
  const sourcePath = path.join(root, relativePath);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`shared path is missing: ${relativePath}`);
  }

  const targetPath = path.join(targetRoot, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.cpSync(sourcePath, targetPath, {
    recursive: true,
    filter: (source) => !isExcludedPath(path.relative(root, source), exclusions),
  });

  return {
    source: relativePath,
    target: path.relative(targetRoot, targetPath).replaceAll(path.sep, '/'),
  };
}

function copyMetadataFiles(releaseRoot, distRoot) {
  for (const fileName of METADATA_FILES) {
    const sourcePath = path.join(releaseRoot, fileName);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }
    fs.mkdirSync(distRoot, { recursive: true });
    fs.copyFileSync(sourcePath, path.join(distRoot, fileName));
  }
}

function runGit(root, args, description) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || `${description} failed`);
  }
  return result.stdout.trim();
}

export function validateBundleSource({ root, baseCommit, sharedPaths, exclusions = [] }) {
  const targetCommit = runGit(
    root,
    ['rev-parse', `${baseCommit}^{commit}`],
    `git rev-parse ${baseCommit}^{commit}`,
  );
  if (sharedPaths.length === 0) {
    throw new Error('release manifest does not declare any shared paths');
  }

  const diffResult = spawnSync('git', ['diff', '--quiet', targetCommit, '--', ...sharedPaths], {
    cwd: root,
    encoding: 'utf8',
  });
  if (diffResult.status === 1) {
    throw new Error('shared release paths contain changes outside manifest baseCommit');
  }
  if (diffResult.status !== 0) {
    throw new Error(diffResult.stderr?.trim() || 'git diff validation failed');
  }

  for (const [label, args] of [
    ['untracked', ['ls-files', '--others', '--exclude-standard', '--', ...sharedPaths]],
    ['ignored', ['ls-files', '--others', '--ignored', '--exclude-standard', '--', ...sharedPaths]],
  ]) {
    const output = runGit(root, args, `git ls-files ${label}`);
    const unexpectedPaths = output
      .split(/\r?\n/u)
      .filter(Boolean)
      .filter((relativePath) => !isExcludedPath(relativePath, exclusions));
    if (unexpectedPaths.length > 0) {
      throw new Error(`shared release paths contain ${label} files: ${unexpectedPaths.join(', ')}`);
    }
  }

  return targetCommit;
}

function writeReleaseModuleBoundary(distRoot, releaseVersion) {
  fs.writeFileSync(
    path.join(distRoot, 'go.mod'),
    `module pantheon-foundation-release/${releaseVersion}\n\ngo 1.24.0\n`,
    'utf8',
  );
}

function createArchive(distRoot, releaseVersion) {
  const archiveName = `foundation-release-${releaseVersion}.tgz`;
  const archivePath = path.join(distRoot, archiveName);
  const entries = [
    ...METADATA_FILES.filter((fileName) => fs.existsSync(path.join(distRoot, fileName))),
    'go.mod',
    'bundle',
    'repo.tar',
    'repo.tar.sha256',
  ];
  const result = spawnSync('tar', ['-czf', archiveName, ...entries], {
    cwd: distRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || `failed to create ${archiveName}`);
  }

  const checksum = crypto.createHash('sha256').update(fs.readFileSync(archivePath)).digest('hex');
  fs.writeFileSync(path.join(distRoot, `${archiveName}.sha256`), `${checksum}  ${archiveName}\n`, 'utf8');

  return {
    archiveName,
    archivePath,
    checksum,
  };
}

export function createRepoSnapshot({ root, sourceCommit, distRoot }) {
  const repoTarPath = path.join(distRoot, 'repo.tar');
  const result = spawnSync(
    'git',
    ['archive', '--format=tar', '--output', repoTarPath, sourceCommit],
    { cwd: root, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || 'failed to create repo.tar snapshot');
  }

  const checksum = crypto.createHash('sha256').update(fs.readFileSync(repoTarPath)).digest('hex');
  fs.writeFileSync(path.join(distRoot, 'repo.tar.sha256'), `${checksum}  repo.tar\n`, 'utf8');

  return {
    assetName: 'repo.tar',
    sha256: checksum,
    baseCommit: sourceCommit,
    generatedFrom: 'git-archive',
  };
}

export function createReleaseBundle(options) {
  const { releaseRoot, distRoot, bundleRoot } = resolveReleaseRoots(options.root, options.releaseVersion);
  const manifest = readManifest(releaseRoot);
  if (manifest.releaseVersion !== options.releaseVersion) {
    throw new Error(
      `manifest releaseVersion ${manifest.releaseVersion} does not match ${options.releaseVersion}`,
    );
  }
  assertSharedFrontendOwnership(options.root, manifest.sharedPaths?.frontend);
  const sharedPaths = [
    ...(manifest.sharedPaths?.backend || []),
    ...(manifest.sharedPaths?.frontend || []),
    ...(manifest.sharedPaths?.docs || []),
  ];
  const sourceCommit = validateBundleSource({
    root: options.root,
    baseCommit: manifest.baseCommit,
    sharedPaths,
    exclusions: manifest.bundleExclusions ?? [],
  });
  const pathReport = {
    releaseVersion: manifest.releaseVersion,
    sourceCommit,
    copiedAt: new Date().toISOString(),
    exclusions: manifest.bundleExclusions ?? [],
    backend: [],
    frontend: [],
    docs: [],
  };

  fs.rmSync(distRoot, { recursive: true, force: true });
  fs.mkdirSync(bundleRoot, { recursive: true });
  copyMetadataFiles(releaseRoot, distRoot);
  writeReleaseModuleBoundary(distRoot, manifest.releaseVersion);
  const repoSnapshot = createRepoSnapshot({ root: options.root, sourceCommit, distRoot });
  pathReport.repoSnapshot = repoSnapshot;

  for (const relativePath of manifest.sharedPaths?.backend || []) {
    pathReport.backend.push(
      copyEntry(options.root, relativePath, path.join(bundleRoot, 'shared-backend'), manifest.bundleExclusions ?? []),
    );
  }
  for (const relativePath of manifest.sharedPaths?.frontend || []) {
    pathReport.frontend.push(
      copyEntry(options.root, relativePath, path.join(bundleRoot, 'shared-frontend'), manifest.bundleExclusions ?? []),
    );
  }
  for (const relativePath of manifest.sharedPaths?.docs || []) {
    pathReport.docs.push(
      copyEntry(options.root, relativePath, path.join(bundleRoot, 'docs'), manifest.bundleExclusions ?? []),
    );
  }

  fs.writeFileSync(path.join(bundleRoot, 'manifest.paths.json'), `${JSON.stringify(pathReport, null, 2)}\n`, 'utf8');
  const archive = createArchive(distRoot, manifest.releaseVersion);

  return {
    distRoot,
    bundleRoot,
    manifest,
    pathReport,
    archive,
    repoSnapshot,
  };
}

function printHelp() {
  console.log(`Usage:
  node scripts/foundation-release/build-release-bundle.mjs --release-version <version> [--root <path>]`);
}

function main() {
  let options;

  try {
    options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return 0;
    }
    createReleaseBundle(options);
    return 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exitCode = main();
}
