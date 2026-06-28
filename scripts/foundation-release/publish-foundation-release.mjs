import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { buildReleaseHelp, parseReleaseArgs } from './release-cli.mjs';

const PLACEHOLDER_RELEASE_TEXTS = new Set([
  'No release notes provided.',
  'No upgrade notes provided.',
  'No consumer impact summary provided.',
]);

export function buildGitHubReleaseTitle(releaseVersion) {
  const normalizedReleaseVersion = String(releaseVersion ?? '').trim();
  if (!normalizedReleaseVersion) {
    throw new Error('releaseVersion is required to build GitHub release title');
  }
  const shortVersionMatch = normalizedReleaseVersion.match(/(?:^|-)v\d+\.\d+\.\d+(?:-(?:rc|beta|alpha)\.\d+)?$/u);
  if (shortVersionMatch) {
    const matched = shortVersionMatch[0];
    return matched.startsWith('v') ? matched : matched.slice(1);
  }
  return normalizedReleaseVersion;
}

function printHelp() {
  console.log(buildReleaseHelp('publish-foundation-release.mjs'));
}

function runCommand(command, args, description, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr).trim() : '';
    const suffix = stderr ? `: ${stderr}` : '';
    throw new Error(`${description} failed${suffix}`);
  }
}

function parseRepoParts(repoFullName) {
  const [owner, repo] = String(repoFullName ?? '').trim().split('/');
  if (!owner || !repo) {
    throw new Error(`invalid repo full name: ${repoFullName}`);
  }
  return { owner, repo };
}

function resolveRepoFullName(root, explicitRepoFullName) {
  if (explicitRepoFullName) {
    parseRepoParts(explicitRepoFullName);
    return explicitRepoFullName;
  }
  const output = runCommand(
    'gh',
    ['repo', 'view', '--json', 'nameWithOwner'],
    'gh repo view --json nameWithOwner',
    { cwd: root },
  );
  const payload = JSON.parse(output);
  if (!payload?.nameWithOwner) {
    throw new Error('unable to resolve GitHub repository nameWithOwner');
  }
  return payload.nameWithOwner;
}

function ensureCleanWorktree(root) {
  const output = runCommand('git', ['status', '--short'], 'git status --short', { cwd: root });
  if (output) {
    throw new Error('publish-foundation-release requires a clean git worktree');
  }
}

function ensureReleaseDirectory(root, releaseVersion) {
  const releaseRoot = path.join(root, 'releases', releaseVersion);
  if (!fs.existsSync(releaseRoot)) {
    throw new Error(`release directory not found: ${releaseRoot}`);
  }
  const manifestPath = path.join(releaseRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`release manifest not found: ${manifestPath}`);
  }
  return {
    releaseRoot,
    manifestPath,
    distRoot: path.join(root, 'dist', 'foundation-releases', releaseVersion),
  };
}

function ensureReleaseAssetFiles(releasePaths, releaseVersion) {
  const archivePath = path.join(releasePaths.distRoot, `foundation-release-${releaseVersion}.tgz`);
  const checksumPath = `${archivePath}.sha256`;
  const missingFiles = [archivePath, checksumPath].filter((filePath) => !fs.existsSync(filePath));
  if (missingFiles.length > 0) {
    throw new Error(
      `release asset files are missing: ${missingFiles.join(', ')}. Run release:foundation:bundle first.`,
    );
  }
  return [archivePath, checksumPath];
}

function readReleaseFile(releaseRoot, fileName) {
  const filePath = path.join(releaseRoot, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`release file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8').trim();
}

function stripMarkdownTitle(content) {
  return String(content)
    .replace(/^# .*\r?\n+/u, '')
    .trim();
}

export function buildGitHubReleaseBody({ releaseNotes, upgradeNotes, consumerImpact }) {
  return [
    '## Release Notes',
    '',
    stripMarkdownTitle(releaseNotes),
    '',
    '## Upgrade Notes',
    '',
    stripMarkdownTitle(upgradeNotes),
    '',
    '## Consumer Impact',
    '',
    stripMarkdownTitle(consumerImpact),
    '',
  ].join('\n');
}

export function validateReleaseBodySections({ releaseNotes, upgradeNotes, consumerImpact }) {
  const findings = [];
  for (const [label, value] of [
    ['release notes', releaseNotes],
    ['upgrade notes', upgradeNotes],
    ['consumer impact', consumerImpact],
  ]) {
    const content = stripMarkdownTitle(value);
    if (!content) {
      findings.push(`${label} is empty`);
      continue;
    }
    if (PLACEHOLDER_RELEASE_TEXTS.has(content)) {
      findings.push(`${label} still uses placeholder content`);
    }
  }
  return findings;
}

function checkTagExists(root, tagName) {
  const output = runCommand('git', ['tag', '--list', tagName], `git tag --list ${tagName}`, { cwd: root });
  return output.split(/\r?\n/).map((line) => line.trim()).includes(tagName);
}

function resolveTagTargetCommit(root, tagName) {
  return runCommand('git', ['rev-list', '-n', '1', tagName], `git rev-list -n 1 ${tagName}`, { cwd: root });
}

function createAnnotatedTag(root, tagName, targetCommit, message) {
  runCommand(
    'git',
    ['tag', '-a', tagName, targetCommit, '-m', message],
    `git tag -a ${tagName}`,
    { cwd: root },
  );
}

function pushTag(root, remote, tagName) {
  runCommand(
    'git',
    ['push', remote, `refs/tags/${tagName}`],
    `git push ${remote} refs/tags/${tagName}`,
    { cwd: root },
  );
}

function checkGitHubReleaseExists(root, repoFullName, tagName) {
  try {
    runCommand(
      'gh',
      ['release', 'view', tagName, '--repo', repoFullName, '--json', 'tagName'],
      `gh release view ${tagName}`,
      { cwd: root },
    );
    return true;
  } catch {
    return false;
  }
}

function createGitHubRelease(root, repoFullName, tagName, releaseTitle, targetCommit, notes) {
  runCommand(
    'gh',
    [
      'release',
      'create',
      tagName,
      '--repo',
      repoFullName,
      '--target',
      targetCommit,
      '--title',
      releaseTitle,
      '--notes',
      notes,
    ],
    `gh release create ${tagName}`,
    { cwd: root },
  );
}

function updateGitHubRelease(root, repoFullName, tagName, releaseTitle, notes) {
  runCommand(
    'gh',
    [
      'release',
      'edit',
      tagName,
      '--repo',
      repoFullName,
      '--title',
      releaseTitle,
      '--notes',
      notes,
    ],
    `gh release edit ${tagName}`,
    { cwd: root },
  );
}

function uploadGitHubReleaseAssets(root, repoFullName, tagName, assetPaths) {
  runCommand(
    'gh',
    ['release', 'upload', tagName, '--repo', repoFullName, '--clobber', ...assetPaths],
    `gh release upload ${tagName}`,
    { cwd: root },
  );
}

export function publishFoundationRelease(options) {
  const root = path.resolve(options.root);
  const repoFullName = resolveRepoFullName(root, options.repoFullName);
  const releasePaths = ensureReleaseDirectory(root, options.releaseVersion);
  const assetPaths = ensureReleaseAssetFiles(releasePaths, options.releaseVersion);
  const targetCommit =
    options.targetCommit || runCommand('git', ['rev-parse', 'HEAD'], 'git rev-parse HEAD', { cwd: root });
  const tagName = options.releaseVersion;
  const releaseTitle = buildGitHubReleaseTitle(options.releaseVersion);
  const tagMessage = `Foundation release ${tagName}`;
  const releaseNotes = readReleaseFile(releasePaths.releaseRoot, 'release-notes.md');
  const upgradeNotes = readReleaseFile(releasePaths.releaseRoot, 'upgrade-notes.md');
  const consumerImpact = readReleaseFile(releasePaths.releaseRoot, 'consumer-impact.md');
  const releaseBodyValidationFindings = validateReleaseBodySections({
    releaseNotes,
    upgradeNotes,
    consumerImpact,
  });
  if (releaseBodyValidationFindings.length > 0) {
    throw new Error(`release metadata is incomplete: ${releaseBodyValidationFindings.join('; ')}`);
  }
  const releaseBody = buildGitHubReleaseBody({
    releaseNotes,
    upgradeNotes,
    consumerImpact,
  });
  const tagExists = checkTagExists(root, tagName);
  const existingTagTarget = tagExists ? resolveTagTargetCommit(root, tagName) : null;
  if (tagExists && existingTagTarget !== targetCommit) {
    throw new Error(
      `tag ${tagName} already exists at ${existingTagTarget} and does not match target commit ${targetCommit}`,
    );
  }

  const releaseExists = checkGitHubReleaseExists(root, repoFullName, tagName);
  const operations = [];

  if (!tagExists) {
    operations.push({
      type: 'create-tag',
      tagName,
      targetCommit,
      command: ['git', 'tag', '-a', tagName, targetCommit, '-m', tagMessage],
    });
    operations.push({
      type: 'push-tag',
      tagName,
      remote: options.remote,
      command: ['git', 'push', options.remote, `refs/tags/${tagName}`],
    });
  }

  operations.push(
    releaseExists
      ? {
          type: 'update-github-release',
          tagName,
          releaseTitle,
          repoFullName,
          command: ['gh', 'release', 'edit', tagName, '--repo', repoFullName, '--title', releaseTitle],
        }
      : {
          type: 'create-github-release',
          tagName,
          releaseTitle,
          repoFullName,
          targetCommit,
          command: [
            'gh',
            'release',
            'create',
            tagName,
            '--repo',
            repoFullName,
            '--target',
            targetCommit,
            '--title',
            releaseTitle,
          ],
        },
  );
  operations.push({
    type: 'upload-github-release-assets',
    tagName,
    repoFullName,
    assetPaths,
    command: ['gh', 'release', 'upload', tagName, '--repo', repoFullName, '--clobber', ...assetPaths],
  });

  if (options.dryRun) {
    return {
      releaseRoot: releasePaths.releaseRoot,
      distRoot: releasePaths.distRoot,
      releaseVersion: options.releaseVersion,
      repoFullName,
      remote: options.remote,
      targetCommit,
      tagName,
      releaseTitle,
      tagExists,
      releaseExists,
      releaseBody,
      operations,
      assetPaths,
      dryRun: true,
    };
  }

  ensureCleanWorktree(root);

  if (!tagExists) {
    createAnnotatedTag(root, tagName, targetCommit, tagMessage);
    pushTag(root, options.remote, tagName);
  }

  if (releaseExists) {
    updateGitHubRelease(root, repoFullName, tagName, releaseTitle, releaseBody);
  } else {
    createGitHubRelease(root, repoFullName, tagName, releaseTitle, targetCommit, releaseBody);
  }
  uploadGitHubReleaseAssets(root, repoFullName, tagName, assetPaths);

  return {
    releaseRoot: releasePaths.releaseRoot,
    distRoot: releasePaths.distRoot,
    releaseVersion: options.releaseVersion,
    repoFullName,
    remote: options.remote,
    targetCommit,
    tagName,
    releaseTitle,
    tagExists,
    releaseExists,
    releaseBody,
    operations,
    assetPaths,
    dryRun: false,
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
    const result = publishFoundationRelease(options);
    if (options.dryRun) {
      console.log(JSON.stringify(result, null, 2));
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
