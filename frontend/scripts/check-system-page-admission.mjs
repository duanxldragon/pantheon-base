import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const admissionPath = path.resolve(frontendRoot, 'config/system-page-admission.json');

const governancePatterns = ['GovernanceInsightDrawer', 'GovernanceRailToggleButton'];
const heroPatterns = ['system-list__hero', 'system-page-hero'];
const validNarratives = [
  'task-first-list',
  'config-overview',
  'config-group',
  'governance-workbench',
  'audit-console',
  'module-governance',
  'module-onboarding',
];

function fail(message) {
  throw new Error(message);
}

function readAdmissionConfig() {
  return JSON.parse(fs.readFileSync(admissionPath, 'utf8'));
}

function readSourceFile(relativePath) {
  return fs.readFileSync(path.resolve(frontendRoot, relativePath), 'utf8');
}

function assertUniquePaths(entries) {
  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.path)) {
      fail(`Duplicate admission path: ${entry.path}`);
    }
    seen.add(entry.path);
  }
}

function assertForbiddenPatterns(entry, source) {
  if (entry.governanceDrawer === 'forbidden') {
    for (const pattern of governancePatterns) {
      if (source.includes(pattern)) {
        fail(`${entry.path} forbids governance drawer but ${entry.sourceFile} still contains ${pattern}`);
      }
    }
  }
  if (entry.hero === 'forbidden') {
    for (const pattern of heroPatterns) {
      if (source.includes(pattern)) {
        fail(
          `${entry.path} forbids hero but ${entry.sourceFile} still contains ${pattern}; migrate to GovernanceSummaryBar instead`,
        );
      }
    }
  }
}

function assertAllowedPatterns(entry, source) {
  if (entry.governanceDrawer !== 'allowed') {
    return;
  }
  if (!entry.governanceButtonText || !entry.governanceDrawerTitle) {
    fail(`${entry.path} allows governance drawer but is missing button or drawer title metadata`);
  }
  for (const pattern of governancePatterns) {
    if (!source.includes(pattern)) {
      fail(`${entry.path} allows governance drawer but ${entry.sourceFile} is missing ${pattern}`);
    }
  }
}

function assertNarrativeContract(entry) {
  if (!validNarratives.includes(entry.narrative)) {
    fail(`${entry.path} has unsupported narrative: ${entry.narrative}`);
  }
  if (entry.narrative === 'module-governance' || entry.narrative === 'module-onboarding') {
    if (entry.governanceDrawer !== 'forbidden') {
      fail(`${entry.path} is a high-sensitivity module page and must keep governanceDrawer forbidden`);
    }
    if (entry.hero !== 'forbidden') {
      fail(`${entry.path} is a high-sensitivity module page and must keep hero forbidden`);
    }
  }
}

function main() {
  const entries = readAdmissionConfig();
  assertUniquePaths(entries);

  for (const entry of entries) {
    if (!entry.path || !entry.title || !entry.sourceFile || !entry.narrative) {
      fail(`Admission entry is missing required fields: ${JSON.stringify(entry)}`);
    }
    if (!['allowed', 'forbidden'].includes(entry.governanceDrawer)) {
      fail(`${entry.path} has invalid governanceDrawer value: ${entry.governanceDrawer}`);
    }
    if (!['allowed', 'forbidden'].includes(entry.hero)) {
      fail(`${entry.path} has invalid hero value: ${entry.hero}`);
    }

    assertNarrativeContract(entry);
    const source = readSourceFile(entry.sourceFile);
    assertForbiddenPatterns(entry, source);
    assertAllowedPatterns(entry, source);
  }

  console.log(`system page admission check passed for ${entries.length} entries`);
}

main();
