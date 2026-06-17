import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const moduleUrl = pathToFileURL(
  path.resolve(testDir, '../../scripts/check-pr-governance.mjs'),
).href;

const {
  resolveTemplatePath,
  validatePrTemplate,
  validatePrBody,
} = await import(moduleUrl);

function withFixtureRepo(callback) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-base-pr-governance-'));
  try {
    callback(repoRoot);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

const validTemplate = `## 变更摘要

- 改动层级：
- 改动模块：
- 目标问题：
- 预期影响：

## Harness 链路

- Task Packet：
- Task packet：
- Evidence：
- Verification evidence：
- Review Artifact：
- OpenSpec change：
- Trivial change：yes / no
- Quality Profile：auth-security / permission-policy / i18n / ui-runtime / generator / ci-workflow / none
- Ratchet Decision：no-repeat-observed / guide-updated / sensor-added / gate-updated / template-updated / adapter-updated / registry-only
- GitHub Signal：method-gate / repo-quality-gate / runtime-evidence-gate / external-flaky / not-applicable

## Harness adoption markers

- task packet:
- evidence:
- boundaries:
- backend response contract:
- backend DTO contract:
- permission contract:
- audit coverage:
- visual evidence:
- inheritance contract:
- base drift:
- Base/ops inheritance:

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

## 验证记录

- [ ] GitHub required checks 通过

## 审核留痕

- Copilot review：
- CodeQL 结果：
- GitHub checks 结果：
- Auto-merge：
- Duplication Gate 结果：
- 是否高风险改动：
- Residual risk / follow-up：

## 检查清单

- [ ] 已明确本次改动归属
`;

test('validatePrTemplate accepts the pantheon-base governance template structure', () => {
  assert.deepEqual(validatePrTemplate(validTemplate), []);
});

test('resolveTemplatePath prefers the uppercase GitHub template filename', () => {
  const resolved = resolveTemplatePath([
    path.resolve(testDir, '../../.github/PULL_REQUEST_TEMPLATE.md'),
    path.resolve(testDir, '../../.github/pull_request_template.md'),
  ]);

  assert.match(resolved, /PULL_REQUEST_TEMPLATE\.md$/);
});

test('validatePrBody accepts trivial changes without harness artifacts', () => {
  const findings = validatePrBody(`## 变更摘要

- 改动层级：\`platform\`
- 改动模块：\`docs\`
- 目标问题：\`补齐治理文档说明\`
- 预期影响：\`仅影响文档可读性\`

## Harness 链路

- Task Packet：\`none\`
- Task packet：\`none\`
- Evidence：\`none\`
- Verification evidence：\`none\`
- Review Artifact：\`none\`
- OpenSpec change：\`none\`
- Trivial change：\`yes\`
- Quality Profile：\`none\`
- Ratchet Decision：\`no-repeat-observed\`
- GitHub Signal：\`not-applicable\`

## Harness adoption markers

- task packet: \`none\`
- evidence: \`none\`
- boundaries: \`single-layer\`
- backend response contract: \`none\`
- backend DTO contract: \`none\`
- permission contract: \`none\`
- audit coverage: \`none\`
- visual evidence: \`none\`
- inheritance contract: \`none\`
- base drift: \`none\`
- Base/ops inheritance: \`none\`

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

## 验证记录

- [x] GitHub required checks 通过

## 审核留痕

- Copilot review：\`automatic-policy\`
- CodeQL 结果：\`not-applicable\`
- GitHub checks 结果：\`passed\`
- Auto-merge：\`enabled\`
- Duplication Gate 结果：\`not-applicable\`
- 是否高风险改动：\`no\`
- Residual risk / follow-up：\`none\`

## 检查清单

- [x] 已明确本次改动归属
` );

  assert.deepEqual(findings, []);
});

test('validatePrBody rejects missing artifact files for non-trivial changes', () => {
  const findings = validatePrBody(`## 变更摘要

- 改动层级：\`platform\`
- 改动模块：\`workflow\`
- 目标问题：\`补齐 PR 治理门禁\`
- 预期影响：\`PR 留痕进入自动校验\`

## Harness 链路

- Task Packet：\`docs/harness/tasks/2026-06-17-missing.task.md\`
- Task packet：\`docs/harness/tasks/2026-06-17-missing.task.md\`
- Evidence：\`.harness/evidence/2026-06-17-missing/commands.json\`
- Verification evidence：\`.harness/evidence/2026-06-17-missing/summary.md\`
- Review Artifact：\`.harness/evidence/2026-06-17-missing/review.md\`
- OpenSpec change：\`none\`
- Trivial change：\`no\`
- Quality Profile：\`ci-workflow\`
- Ratchet Decision：\`gate-updated\`
- GitHub Signal：\`repo-quality-gate\`

## Harness adoption markers

- task packet: \`docs/harness/tasks/2026-06-17-missing.task.md\`
- evidence: \`.harness/evidence/2026-06-17-missing/\`
- boundaries: \`platform only\`
- backend response contract: \`none\`
- backend DTO contract: \`none\`
- permission contract: \`none\`
- audit coverage: \`none\`
- visual evidence: \`none\`
- inheritance contract: \`none\`
- base drift: \`none\`
- Base/ops inheritance: \`none\`

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

## 验证记录

- [x] GitHub required checks 通过

## 审核留痕

- Copilot review：\`requested\`
- CodeQL 结果：\`queued\`
- GitHub checks 结果：\`pending\`
- Auto-merge：\`not-enabled\`
- Duplication Gate 结果：\`report-only\`
- 是否高风险改动：\`no\`
- Residual risk / follow-up：\`none\`

## 检查清单

- [x] 已明确本次改动归属
`, { rootDir: path.resolve(testDir, '../..') });

  assert.match(findings.join('\n'), /Task Packet/);
  assert.match(findings.join('\n'), /Evidence/);
  assert.match(findings.join('\n'), /Verification evidence/);
  assert.match(findings.join('\n'), /Review Artifact/);
});

test('validatePrBody accepts existing artifact linkage for non-trivial changes', () => {
  withFixtureRepo((repoRoot) => {
    const taskId = '2026-06-17-sample';
    const taskPacketPath = path.join(repoRoot, 'docs', 'harness', 'tasks', `${taskId}.task.md`);
    const commandsArtifactPath = path.join(
      repoRoot,
      '.harness',
      'evidence',
      taskId,
      'commands.json',
    );
    const summaryArtifactPath = path.join(
      repoRoot,
      '.harness',
      'evidence',
      taskId,
      'summary.md',
    );
    const reviewArtifactPath = path.join(
      repoRoot,
      '.harness',
      'evidence',
      taskId,
      'review.md',
    );

    fs.mkdirSync(path.dirname(taskPacketPath), { recursive: true });
    fs.mkdirSync(path.dirname(commandsArtifactPath), { recursive: true });
    fs.writeFileSync(taskPacketPath, '# Task Packet: sample\n', 'utf8');
    fs.writeFileSync(commandsArtifactPath, '{"commands":[]}\n', 'utf8');
    fs.writeFileSync(summaryArtifactPath, '# Verification Summary: sample\n', 'utf8');
    fs.writeFileSync(reviewArtifactPath, '# Review Summary: sample\n', 'utf8');

    const body = `## 变更摘要

- 改动层级：\`platform\`
- 改动模块：\`workflow\`
- 目标问题：\`补齐 PR 治理门禁\`
- 预期影响：\`PR 留痕进入自动校验\`

## Harness 链路

- Task Packet：\`docs/harness/tasks/${taskId}.task.md\`
- Task packet：\`docs/harness/tasks/${taskId}.task.md\`
- Evidence：\`.harness/evidence/${taskId}/commands.json\`
- Verification evidence：\`.harness/evidence/${taskId}/summary.md\`
- Review Artifact：\`.harness/evidence/${taskId}/review.md\`
- OpenSpec change：\`none\`
- Trivial change：\`no\`
- Quality Profile：\`ci-workflow\`
- Ratchet Decision：\`gate-updated\`
- GitHub Signal：\`repo-quality-gate\`

## Harness adoption markers

- task packet: \`docs/harness/tasks/${taskId}.task.md\`
- evidence: \`.harness/evidence/${taskId}/\`
- boundaries: \`platform only\`
- backend response contract: \`none\`
- backend DTO contract: \`none\`
- permission contract: \`none\`
- audit coverage: \`none\`
- visual evidence: \`none\`
- inheritance contract: \`none\`
- base drift: \`none\`
- Base/ops inheritance: \`none\`

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

## 验证记录

- [x] GitHub required checks 通过

## 审核留痕

- Copilot review：\`requested\`
- CodeQL 结果：\`queued\`
- GitHub checks 结果：\`pending\`
- Auto-merge：\`not-enabled\`
- Duplication Gate 结果：\`report-only\`
- 是否高风险改动：\`no\`
- Residual risk / follow-up：\`follow-up tracked in task packet\`

## 检查清单

- [x] 已明确本次改动归属
`;

    assert.deepEqual(validatePrBody(body, { rootDir: repoRoot }), []);
  });
});

test('validatePrBody rejects mismatched task-id linkage for non-trivial changes', () => {
  withFixtureRepo((repoRoot) => {
    const taskPacketPath = path.join(
      repoRoot,
      'docs',
      'harness',
      'tasks',
      '2026-06-17-sample.task.md',
    );
    const commandsArtifactPath = path.join(
      repoRoot,
      '.harness',
      'evidence',
      '2026-06-17-other',
      'commands.json',
    );
    const summaryArtifactPath = path.join(
      repoRoot,
      '.harness',
      'evidence',
      '2026-06-17-sample',
      'summary.md',
    );
    const reviewArtifactPath = path.join(
      repoRoot,
      '.harness',
      'evidence',
      '2026-06-17-sample',
      'review.md',
    );

    fs.mkdirSync(path.dirname(taskPacketPath), { recursive: true });
    fs.mkdirSync(path.dirname(commandsArtifactPath), { recursive: true });
    fs.mkdirSync(path.dirname(summaryArtifactPath), { recursive: true });
    fs.writeFileSync(taskPacketPath, '# Task Packet: sample\n', 'utf8');
    fs.writeFileSync(commandsArtifactPath, '{"commands":[]}\n', 'utf8');
    fs.writeFileSync(summaryArtifactPath, '# Verification Summary: sample\n', 'utf8');
    fs.writeFileSync(reviewArtifactPath, '# Review Summary: sample\n', 'utf8');

    const findings = validatePrBody(`## 变更摘要

- 改动层级：\`platform\`
- 改动模块：\`workflow\`
- 目标问题：\`补齐 PR 治理门禁\`
- 预期影响：\`PR 留痕进入自动校验\`

## Harness 链路

- Task Packet：\`docs/harness/tasks/2026-06-17-sample.task.md\`
- Task packet：\`docs/harness/tasks/2026-06-17-sample.task.md\`
- Evidence：\`.harness/evidence/2026-06-17-other/commands.json\`
- Verification evidence：\`.harness/evidence/2026-06-17-sample/summary.md\`
- Review Artifact：\`.harness/evidence/2026-06-17-sample/review.md\`
- OpenSpec change：\`none\`
- Trivial change：\`no\`
- Quality Profile：\`ci-workflow\`
- Ratchet Decision：\`gate-updated\`
- GitHub Signal：\`repo-quality-gate\`

## Harness adoption markers

- task packet: \`docs/harness/tasks/2026-06-17-sample.task.md\`
- evidence: \`.harness/evidence/2026-06-17-other/\`
- boundaries: \`platform only\`
- backend response contract: \`none\`
- backend DTO contract: \`none\`
- permission contract: \`none\`
- audit coverage: \`none\`
- visual evidence: \`none\`
- inheritance contract: \`none\`
- base drift: \`none\`
- Base/ops inheritance: \`none\`

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

## 验证记录

- [x] GitHub required checks 通过

## 审核留痕

- Copilot review：\`requested\`
- CodeQL 结果：\`queued\`
- GitHub checks 结果：\`pending\`
- Auto-merge：\`not-enabled\`
- Duplication Gate 结果：\`report-only\`
- 是否高风险改动：\`no\`
- Residual risk / follow-up：\`follow-up tracked in task packet\`

## 检查清单

- [x] 已明确本次改动归属
`, { rootDir: repoRoot });

    assert.match(findings.join('\n'), /same task-id/);
  });
});
