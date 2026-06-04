import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

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

function copyEntry(root, relativePath, targetRoot) {
  const sourcePath = path.join(root, relativePath);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`shared path is missing: ${relativePath}`);
  }

  const targetPath = path.join(targetRoot, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.cpSync(sourcePath, targetPath, { recursive: true });

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

export function createReleaseBundle(options) {
  const { releaseRoot, distRoot, bundleRoot } = resolveReleaseRoots(options.root, options.releaseVersion);
  const manifest = readManifest(releaseRoot);
  const pathReport = {
    releaseVersion: manifest.releaseVersion,
    copiedAt: new Date().toISOString(),
    backend: [],
    frontend: [],
    docs: [],
  };

  fs.mkdirSync(bundleRoot, { recursive: true });
  copyMetadataFiles(releaseRoot, distRoot);

  for (const relativePath of manifest.sharedPaths?.backend || []) {
    pathReport.backend.push(copyEntry(options.root, relativePath, path.join(bundleRoot, 'shared-backend')));
  }
  for (const relativePath of manifest.sharedPaths?.frontend || []) {
    pathReport.frontend.push(copyEntry(options.root, relativePath, path.join(bundleRoot, 'shared-frontend')));
  }
  for (const relativePath of manifest.sharedPaths?.docs || []) {
    pathReport.docs.push(copyEntry(options.root, relativePath, path.join(bundleRoot, 'docs')));
  }

  fs.writeFileSync(path.join(bundleRoot, 'manifest.paths.json'), `${JSON.stringify(pathReport, null, 2)}\n`, 'utf8');

  return {
    distRoot,
    bundleRoot,
    manifest,
    pathReport,
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
