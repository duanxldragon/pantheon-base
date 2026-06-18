import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const TEMPLATE_CANDIDATES = [
  path.join(root, '.github', 'PULL_REQUEST_TEMPLATE.md'),
  path.join(root, '.github', 'pull_request_template.md'),
];

const REQUIRED_SECTIONS = [
  '## 变更摘要',
  '## Harness 链路',
  '## Harness adoption markers',
  '## 边界说明',
  '## 验证记录',
  '## 审核留痕',
  '## 检查清单',
];

const REQUIRED_FIELDS = [
  { label: '改动层级', allowExplicitNone: false },
  { label: '改动模块', allowExplicitNone: false },
  { label: '目标问题', allowExplicitNone: false },
  { label: '预期影响', allowExplicitNone: false },
  { label: 'Task Packet', allowExplicitNone: true },
  { label: 'Task packet', allowExplicitNone: true },
  { label: 'Evidence', allowExplicitNone: true },
  { label: 'Verification evidence', allowExplicitNone: true },
  { label: 'Review Artifact', allowExplicitNone: true },
  { label: 'OpenSpec change', allowExplicitNone: true },
  { label: 'Trivial change', allowExplicitNone: false },
  { label: 'Quality Profile', allowExplicitNone: false },
  { label: 'Ratchet Decision', allowExplicitNone: false },
  { label: 'GitHub Signal', allowExplicitNone: false },
  { label: 'task packet', allowExplicitNone: true },
  { label: 'evidence', allowExplicitNone: true },
  { label: 'boundaries', allowExplicitNone: true },
  { label: 'backend response contract', allowExplicitNone: true },
  { label: 'backend DTO contract', allowExplicitNone: true },
  { label: 'permission contract', allowExplicitNone: true },
  { label: 'audit coverage', allowExplicitNone: true },
  { label: 'visual evidence', allowExplicitNone: true },
  { label: 'inheritance contract', allowExplicitNone: true },
  { label: 'base drift', allowExplicitNone: true },
  { label: 'Base/ops inheritance', allowExplicitNone: true },
  { label: 'Copilot review', allowExplicitNone: false },
  { label: 'CodeQL 结果', allowExplicitNone: false },
  { label: 'GitHub checks 结果', allowExplicitNone: false },
  { label: 'Auto-merge', allowExplicitNone: false },
  { label: 'Duplication Gate 结果', allowExplicitNone: false },
  { label: '是否高风险改动', allowExplicitNone: false },
  { label: 'Residual risk / follow-up', allowExplicitNone: true },
];

const EXPLICIT_NONE = new Set(['none', 'n/a', 'na', 'not-applicable', 'not applicable']);
const YES_VALUES = new Set(['yes', 'true']);
const NO_VALUES = new Set(['no', 'false']);
const QUALITY_PROFILES = new Set([
  'auth-security',
  'permission-policy',
  'i18n',
  'ui-runtime',
  'generator',
  'ci-workflow',
  'none',
]);
const RATCHET_DECISIONS = new Set([
  'no-repeat-observed',
  'guide-updated',
  'sensor-added',
  'gate-updated',
  'template-updated',
  'adapter-updated',
  'registry-only',
]);
const GITHUB_SIGNALS = new Set([
  'method-gate',
  'repo-quality-gate',
  'runtime-evidence-gate',
  'external-flaky',
  'not-applicable',
]);
const PLACEHOLDER_PATTERNS = [
  /^<.*>$/i,
  /^\[.*fill.*\]$/i,
  /^(todo|tbd)$/i,
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeValue(value) {
  return value.trim().replace(/^`+/, '').replace(/`+$/, '').trim();
}

function parseField(content, label) {
  const pattern = new RegExp(`^[\\-*]\\s+${escapeRegExp(label)}[：:]\\s*(.+)$`, 'mi');
  const match = content.match(pattern);
  return match ? normalizeValue(match[1]) : null;
}

function isPlaceholder(value) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function normalizeRepoRelativePath(value) {
  return value.replaceAll('\\', '/').replace(/^\.\/+/, '').replace(/^\/+/, '');
}

function hasExistingRepoFile(rootDir, value) {
  if (value.includes('://')) {
    return false;
  }
  const normalized = normalizeRepoRelativePath(value);
  if (!normalized || path.isAbsolute(value) || normalized.startsWith('..')) {
    return false;
  }
  return fs.existsSync(path.join(rootDir, normalized));
}

function extractTaskIdFromTaskPacketPath(value) {
  const match = normalizeRepoRelativePath(value).match(/^docs\/harness\/tasks\/(.+)\.task\.md$/i);
  return match ? match[1] : null;
}

function extractTaskIdFromArtifactPath(value, suffix) {
  const pattern = new RegExp(`^\\.harness/evidence/(.+)/${suffix}$`, 'i');
  const match = normalizeRepoRelativePath(value).match(pattern);
  return match ? match[1] : null;
}

function validateFileReference({
  findings,
  fieldLabel,
  value,
  rootDir,
  pattern,
  placeholderMessage,
}) {
  if (value === null) {
    return;
  }
  if (EXPLICIT_NONE.has(value.toLowerCase())) {
    return;
  }
  if (isPlaceholder(value)) {
    findings.push(`placeholder value is not allowed for PR field: ${fieldLabel}`);
    return;
  }
  const normalized = normalizeRepoRelativePath(value);
  if (!pattern.test(normalized)) {
    findings.push(`${fieldLabel} must reference ${placeholderMessage}`);
    return;
  }
  if (!hasExistingRepoFile(rootDir, normalized)) {
    findings.push(`${fieldLabel} file does not exist in repository: ${normalized}`);
  }
}

function validateArtifactLinkage(content, rootDir, findings) {
  const taskPacketValue = parseField(content, 'Task Packet');
  const legacyTaskPacketValue = parseField(content, 'Task packet');
  const evidenceValue = parseField(content, 'Evidence');
  const verificationEvidenceValue = parseField(content, 'Verification evidence');
  const reviewArtifactValue = parseField(content, 'Review Artifact');
  const trivialValue = parseField(content, 'Trivial change')?.toLowerCase() ?? '';
  const isTrivial = YES_VALUES.has(trivialValue);

  if (
    taskPacketValue !== null &&
    legacyTaskPacketValue !== null &&
    taskPacketValue !== legacyTaskPacketValue
  ) {
    findings.push('Task Packet and Task packet must match');
  }

  if (!isTrivial) {
    for (const [fieldLabel, value] of [
      ['Task Packet', taskPacketValue],
      ['Task packet', legacyTaskPacketValue],
      ['Evidence', evidenceValue],
      ['Verification evidence', verificationEvidenceValue],
      ['Review Artifact', reviewArtifactValue],
    ]) {
      if (value === null || EXPLICIT_NONE.has(value.toLowerCase())) {
        findings.push(`explicit none is not allowed for PR field: ${fieldLabel}`);
      }
    }
  }

  validateFileReference({
    findings,
    fieldLabel: 'Task Packet',
    value: taskPacketValue,
    rootDir,
    pattern: /^docs\/harness\/tasks\/.+\.task\.md$/i,
    placeholderMessage: 'docs/harness/tasks/<task-id>.task.md',
  });
  validateFileReference({
    findings,
    fieldLabel: 'Task packet',
    value: legacyTaskPacketValue,
    rootDir,
    pattern: /^docs\/harness\/tasks\/.+\.task\.md$/i,
    placeholderMessage: 'docs/harness/tasks/<task-id>.task.md',
  });
  validateFileReference({
    findings,
    fieldLabel: 'Evidence',
    value: evidenceValue,
    rootDir,
    pattern: /^\.harness\/evidence\/.+\/commands\.json$/i,
    placeholderMessage: '.harness/evidence/<task-id>/commands.json',
  });
  validateFileReference({
    findings,
    fieldLabel: 'Verification evidence',
    value: verificationEvidenceValue,
    rootDir,
    pattern: /^\.harness\/evidence\/.+\/summary\.md$/i,
    placeholderMessage: '.harness/evidence/<task-id>/summary.md',
  });
  validateFileReference({
    findings,
    fieldLabel: 'Review Artifact',
    value: reviewArtifactValue,
    rootDir,
    pattern: /^\.harness\/evidence\/.+\/review\.md$/i,
    placeholderMessage: '.harness/evidence/<task-id>/review.md',
  });

  const taskPacketTaskId = taskPacketValue ? extractTaskIdFromTaskPacketPath(taskPacketValue) : null;
  const legacyTaskPacketTaskId = legacyTaskPacketValue
    ? extractTaskIdFromTaskPacketPath(legacyTaskPacketValue)
    : null;
  const evidenceTaskId = evidenceValue
    ? extractTaskIdFromArtifactPath(evidenceValue, 'commands\\.json')
    : null;
  const verificationTaskId = verificationEvidenceValue
    ? extractTaskIdFromArtifactPath(verificationEvidenceValue, 'summary\\.md')
    : null;
  const reviewTaskId = reviewArtifactValue
    ? extractTaskIdFromArtifactPath(reviewArtifactValue, 'review\\.md')
    : null;
  const canonicalTaskId = taskPacketTaskId ?? legacyTaskPacketTaskId;

  if (canonicalTaskId && legacyTaskPacketTaskId && canonicalTaskId !== legacyTaskPacketTaskId) {
    findings.push('Task Packet and Task packet must reference the same task-id');
  }
  if (canonicalTaskId && evidenceTaskId && canonicalTaskId !== evidenceTaskId) {
    findings.push('Task Packet and Evidence must reference the same task-id');
  }
  if (canonicalTaskId && verificationTaskId && canonicalTaskId !== verificationTaskId) {
    findings.push('Task Packet and Verification evidence must reference the same task-id');
  }
  if (canonicalTaskId && reviewTaskId && canonicalTaskId !== reviewTaskId) {
    findings.push('Task Packet and Review Artifact must reference the same task-id');
  }
}

function validateEnum(findings, label, value, allowed) {
  if (value === null) {
    return;
  }
  if (!allowed.has(value)) {
    findings.push(`invalid value for PR field: ${label}`);
  }
}

function isAllowedExplicitNoneValue(fieldLabel, normalizedValue) {
  if (fieldLabel === 'Quality Profile' && normalizedValue === 'none') {
    return true;
  }
  if (
    (fieldLabel === 'GitHub Signal' ||
      fieldLabel === 'CodeQL 结果' ||
      fieldLabel === 'Duplication Gate 结果') &&
    (normalizedValue === 'not-applicable' || normalizedValue === 'not applicable')
  ) {
    return true;
  }
  return false;
}

export function validatePrTemplate(content) {
  const findings = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(section)) {
      findings.push(`missing required section: ${section}`);
    }
  }

  for (const field of REQUIRED_FIELDS) {
    if (parseField(content, field.label) === null) {
      findings.push(`missing required field: ${field.label}`);
    }
  }

  return findings;
}

export function validatePrBody(content, options = {}) {
  const findings = [];
  const rootDir = options.rootDir ?? root;

  if (!content.trim()) {
    return ['pull request body is empty'];
  }

  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(section)) {
      findings.push(`missing required section in PR body: ${section}`);
    }
  }

  for (const field of REQUIRED_FIELDS) {
    const value = parseField(content, field.label);
    if (value === null) {
      findings.push(`missing required field in PR body: ${field.label}`);
      continue;
    }
    if (!value) {
      findings.push(`empty required field in PR body: ${field.label}`);
      continue;
    }
    if (isPlaceholder(value)) {
      findings.push(`placeholder value is not allowed for PR field: ${field.label}`);
      continue;
    }
    const normalizedValue = value.toLowerCase();
    if (
      !field.allowExplicitNone &&
      EXPLICIT_NONE.has(normalizedValue) &&
      !isAllowedExplicitNoneValue(field.label, normalizedValue)
    ) {
      findings.push(`explicit none is not allowed for PR field: ${field.label}`);
    }
  }

  const trivialValue = parseField(content, 'Trivial change')?.toLowerCase() ?? '';
  if (!YES_VALUES.has(trivialValue) && !NO_VALUES.has(trivialValue)) {
    findings.push('Trivial change must be yes or no');
  }

  const qualityProfileValue = parseField(content, 'Quality Profile')?.toLowerCase() ?? null;
  validateEnum(findings, 'Quality Profile', qualityProfileValue, QUALITY_PROFILES);

  const ratchetDecisionValue = parseField(content, 'Ratchet Decision')?.toLowerCase() ?? null;
  validateEnum(findings, 'Ratchet Decision', ratchetDecisionValue, RATCHET_DECISIONS);

  const githubSignalValue = parseField(content, 'GitHub Signal')?.toLowerCase() ?? null;
  validateEnum(findings, 'GitHub Signal', githubSignalValue, GITHUB_SIGNALS);

  if (NO_VALUES.has(trivialValue) && qualityProfileValue === 'none') {
    findings.push('Quality Profile must not be none for non-trivial changes');
  }

  validateArtifactLinkage(content, rootDir, findings);

  return findings;
}

export function resolveTemplatePath(templateCandidates = TEMPLATE_CANDIDATES) {
  for (const templatePath of templateCandidates) {
    if (fs.existsSync(templatePath)) {
      return templatePath;
    }
  }
  throw new Error(`PR template file does not exist: ${templateCandidates.join(', ')}`);
}

function readTemplate(templatePath = resolveTemplatePath()) {
  return fs.readFileSync(templatePath, 'utf8');
}

function readPrBodyFromEvent(eventPath) {
  if (!eventPath) {
    throw new Error('missing --event <github-event.json>');
  }
  const payload = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  return String(payload?.pull_request?.body ?? '');
}

function reportAndExit(findings, successMessage) {
  if (findings.length > 0) {
    console.error('Pantheon Base PR governance check failed');
    for (const finding of findings) {
      console.error(`- ${finding}`);
    }
    process.exit(1);
  }
  console.log(successMessage);
}

function main(argv) {
  const args = [...argv];
  const eventFlagIndex = args.indexOf('--event');

  if (eventFlagIndex >= 0) {
    const eventPath = args[eventFlagIndex + 1];
    const body = readPrBodyFromEvent(eventPath);
    reportAndExit(validatePrBody(body), 'OK pantheon-base PR body governance fields are present');
    return;
  }

  reportAndExit(
    validatePrTemplate(readTemplate()),
    'OK pantheon-base PR template governance fields are present',
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
