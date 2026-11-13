import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { aggregateSha256, assertPublicReviewPackaging, assertCandidatePath, assertInventory, assertRealPath, candidateExports, encodeCandidateArchive, LIMITS, sha256, validateCandidateDescriptor, verifyCandidateArchive, withCandidateFiles } from './candidate-descriptor.mjs';

const within = (child, parent) => {
  const relative = path.relative(parent, child);
  return !path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`);
};

function directoryIdentity(absolute) {
  // Windows directory IDs may exceed Number.MAX_SAFE_INTEGER. Fail closed
  // when the filesystem cannot provide a real directory instance identity.
  const stat = fs.lstatSync(absolute, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink() || typeof stat.dev !== 'bigint' || stat.dev < 0n || typeof stat.ino !== 'bigint' || stat.ino <= 0n) throw new Error(`Unavailable candidate directory identity: ${absolute}`);
  return [stat.dev, stat.ino];
}

export function captureCandidateSources(root, sourcePaths) {
  assertRealPath(root, { directory: true });
  if (!Array.isArray(sourcePaths) || !sourcePaths.length || new Set(sourcePaths).size !== sourcePaths.length) throw new Error('Explicit candidate sourcePaths inventory is required');
  const entries = new Map();
  const stamps = new Map();
  const stamp = (stat) => [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs, stat.mode, stat.nlink].map(String);
  const visit = (relative) => {
    assertCandidatePath(relative);
    const absolute = assertRealPath(path.join(root, relative), { directory: fs.lstatSync(path.join(root, relative)).isDirectory() });
    const stat = fs.lstatSync(absolute, { bigint: true });
    stamps.set(relative, stamp(stat));
    if (stat.isDirectory()) {
      if (relative.startsWith('.harness/')) throw new Error('Public review sources must be explicitly selected regular leaves');
      if (relative === 'config' || relative.endsWith('/config')) throw new Error('Candidate config inputs must be explicitly declared files');
      for (const name of fs.readdirSync(absolute).sort()) visit(`${relative}/${name}`);
    } else {
      const bytes = withCandidateFiles([{ path: absolute, maxBytes: LIMITS.fileBytes, label: 'Candidate source' }], ([opened]) => {
        if (JSON.stringify(stamp(opened.stat)) !== JSON.stringify(stamp(stat))) throw new Error('Candidate source changed while opening');
        return opened.bytes;
      });
      entries.set(relative, { path: relative, bytes });
      if (entries.size > LIMITS.files) throw new Error('Candidate source file count exceeds limit');
    }
  };
  for (const relative of sourcePaths) visit(relative);
  const captured = [...entries.values()].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const files = captured.map((entry) => ({ path: entry.path, bytes: entry.bytes.length, sha256: sha256(entry.bytes) }));
  assertInventory(files);
  assertPublicReviewPackaging(captured);
  return { entries: captured, files, stamps: [...stamps.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0) };
}

export function assertCandidateExports(entries, requiredExports) {
  const sources = new Map(entries.map((entry) => [entry.path, entry.bytes.toString('utf8')]));
  for (const entry of requiredExports) {
    // Remove comments and strings before checking top-level Go declarations.
    // This presence check is intentionally weaker than compile/runtime review.
    const source = sources.get(entry.path)?.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|`[^`]*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gu, (match) => match.replace(/[^\n]/gu, ' '));
    if (!source || !new RegExp(`^(?:func\\s+${entry.name}\\s*\\(|type\\s+${entry.name}\\s+)`, 'mu').test(source)) throw new Error(`Missing required API export: ${entry.path}#${entry.name}`);
  }
}

export function buildCandidateArtifact({ root, baseCommit, sourcePaths, sharedPaths, evidenceIds, reviewIds, capabilities, outputRoot } = {}) {
  root = path.resolve(root ?? process.cwd());
  if (!/^[a-f0-9]{40}$/u.test(baseCommit ?? '')) throw new Error('Candidate baseCommit must be a real 40-hex provenance commit');
  const provenance = spawnSync('git', ['rev-parse', '--verify', `${baseCommit}^{commit}`], { cwd: root, encoding: 'utf8' });
  if (provenance.status !== 0 || provenance.stdout.trim() !== baseCommit) throw new Error('Candidate provenance commit does not exist in source repository');
  if (!outputRoot) throw new Error('Candidate outputRoot is required');
  const output = path.resolve(outputRoot);
  assertRealPath(output, { directory: true, missing: true });
  if (fs.existsSync(output)) throw new Error('Candidate outputRoot must not already exist');
  if (within(root, output) || (sourcePaths ?? []).some((relative) => within(output, path.resolve(root, assertCandidatePath(relative))))) throw new Error('Candidate output overlaps source inventory');
  // Inside Base, candidates can only be published under the dedicated staging root.
  const relativeOutput = path.relative(root, output).replaceAll('\\', '/');
  if (within(output, root) && !relativeOutput.startsWith('.tmp/foundation-candidates/')) throw new Error('In-repository candidate output must be below .tmp/foundation-candidates');
  const before = captureCandidateSources(root, sourcePaths);
  const aggregate = aggregateSha256(before.files);
  const identity = `candidate-${aggregate}`;
  const archive = encodeCandidateArchive(before.entries);
  const descriptor = {
    schemaVersion: 1, kind: 'pantheon-base-candidate', consumerMode: 'candidate-staging', sourceRepo: 'pantheon-base',
    baseCommit, candidateIdentity: identity, files: before.files, sharedPaths, evidenceIds, reviewIds, capabilities,
    requiredExports: candidateExports(capabilities, before.files), aggregateSha256: aggregate,
    artifact: { assetName: `${identity}.tar`, sha256: sha256(archive) },
  };
  validateCandidateDescriptor(descriptor);
  assertCandidateExports(before.entries, descriptor.requiredExports);
  verifyCandidateArchive(archive, descriptor);
  const descriptorBytes = Buffer.from(`${JSON.stringify(descriptor, null, 2)}\n`);
  if (descriptorBytes.length > LIMITS.descriptorBytes) throw new Error('Candidate descriptor size exceeds limit');
  const descriptorSha256 = sha256(descriptorBytes);
  const parent = path.dirname(output);
  fs.mkdirSync(parent, { recursive: true });
  assertRealPath(parent, { directory: true });
  const ancestors = [];
  for (let current = parent; ; current = path.dirname(current)) {
    ancestors.unshift(current);
    if (current === path.dirname(current)) break;
  }
  const identities = new Map(ancestors.map((directory) => [directory, directoryIdentity(directory)]));
  const stage = fs.mkdtempSync(path.join(parent, '.candidate-seal-'));
  const stageFiles = [descriptor.artifact.assetName, 'candidate-descriptor.json'];
  const assertStage = () => {
    if (!identities.has(stage)) throw new Error('Unknown candidate stage ownership');
    for (const [directory, expected] of identities) {
      const current = directoryIdentity(directory);
      if (current[0] !== expected[0] || current[1] !== expected[1]) throw new Error(`Replaced candidate directory identity: ${directory}`);
    }
  };
  const assertStageContents = () => {
    assertStage();
    const names = fs.readdirSync(stage);
    for (const name of names) {
      assertStage();
      if (!stageFiles.includes(name)) throw new Error(`Unknown candidate stage entry: ${name}`);
      const stat = fs.lstatSync(path.join(stage, name));
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error(`Unsupported candidate stage entry: ${name}`);
    }
    return names;
  };
  const assertSavedStageBytes = () => {
    assertStage();
    withCandidateFiles([
      { path: path.join(stage, 'candidate-descriptor.json'), maxBytes: LIMITS.descriptorBytes, expectedBytes: descriptorBytes.length, label: 'Candidate saved' },
      { path: path.join(stage, descriptor.artifact.assetName), maxBytes: LIMITS.archiveBytes, expectedBytes: archive.length, label: 'Candidate saved' },
    ], ([savedDescriptor, savedArchive]) => {
      if (!savedDescriptor.bytes.equals(descriptorBytes) || sha256(savedDescriptor.bytes) !== descriptorSha256 || !savedArchive.bytes.equals(archive) || sha256(savedArchive.bytes) !== descriptor.artifact.sha256) throw new Error('Candidate saved bytes/digest mismatch');
      assertStage();
    });
  };
  try {
    // mkdtemp and lstat are separate syscalls; capture immediately. No atomic
    // namespace locking guarantee is provided by these pathname checks.
    identities.set(stage, directoryIdentity(stage));
    assertStage();
    fs.writeFileSync(path.join(stage, descriptor.artifact.assetName), archive, { flag: 'wx' });
    assertStage();
    fs.writeFileSync(path.join(stage, 'candidate-descriptor.json'), descriptorBytes, { flag: 'wx' });
    assertStage();
    withCandidateFiles([{ path: path.join(stage, descriptor.artifact.assetName), maxBytes: LIMITS.archiveBytes, label: 'Candidate saved archive' }], ([{ bytes }]) => {
      verifyCandidateArchive(bytes, descriptor);
      assertStage();
    });
    const after = captureCandidateSources(root, sourcePaths);
    if (JSON.stringify(before.files) !== JSON.stringify(after.files) || JSON.stringify(before.stamps) !== JSON.stringify(after.stamps)) throw new Error('Candidate source changed during sealing; retry with stable sources');
    assertRealPath(output, { directory: true, missing: true });
    if (fs.existsSync(output)) throw new Error('Candidate output was created concurrently');
    if (assertStageContents().length !== stageFiles.length) throw new Error('Candidate stage files changed before sealing');
    assertSavedStageBytes();
    assertStage();
    fs.renameSync(stage, output);
    return { outputRoot: output, artifactPath: path.join(output, descriptor.artifact.assetName), descriptorPath: path.join(output, 'candidate-descriptor.json'), descriptorSha256, descriptor, sourceStable: true };
  } catch (error) {
    try {
      // There are only two possible files. Preflight all content before any
      // unlink, recheck ancestors at each deletion, and never recurse.
      for (const name of assertStageContents()) {
        assertStageContents();
        assertStage();
        fs.unlinkSync(path.join(stage, name));
      }
      assertStageContents();
      assertStage();
      fs.rmdirSync(stage);
    } catch (cleanupError) {
      throw new Error(`Candidate cleanup refused; stage retained: ${stage}; ${cleanupError.message}`, { cause: error });
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === '--help') {
      console.log('Usage: node scripts/foundation-release/build-candidate-artifact.mjs --inventory <reviewed-candidate-input.json> --output <new-directory>');
    } else {
      if (args.length !== 4 || args[0] !== '--inventory' || args[2] !== '--output') throw new Error('Expected --inventory <json> --output <new-directory>');
      const options = withCandidateFiles([{ path: args[1], maxBytes: LIMITS.descriptorBytes, label: 'Candidate input' }], ([{ bytes }]) => JSON.parse(bytes.toString('utf8')));
      const result = buildCandidateArtifact({ ...options, outputRoot: args[3] });
      console.log(JSON.stringify({ kind: result.descriptor.kind, candidateIdentity: result.descriptor.candidateIdentity, descriptorPath: result.descriptorPath, artifactPath: result.artifactPath, descriptorSha256: result.descriptorSha256, sourceStable: result.sourceStable }, null, 2));
    }
  } catch (error) { console.error(error.message); if (error.cause) console.error(`Caused by: ${error.cause.message}`); process.exitCode = 1; }
}
