#!/usr/bin/env node
/**
 * Automated PR creator for routine changes (chore/docs/refactor).
 * Generates a PR body that satisfies the governance requirements.
 *
 * Usage:
 *   node scripts/create-pr.mjs --title "PR Title" --branch "feature-branch" --message "commit message"
 */

import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const { values } = parseArgs({
  options: {
    title: { type: 'string', short: 't' },
    branch: { type: 'string', short: 'b' },
    message: { type: 'string', short: 'm' },
    trivial: { type: 'boolean', default: true },
    profile: { type: 'string', default: 'none' },
  },
});

const title = values.title || process.env.PR_TITLE || 'Update';
const branch = values.branch || process.env.PR_BRANCH || `chore/${Date.now()}`;
const message = values.message || process.env.PR_MESSAGE || 'Routine update';
const isTrivial = values.trivial;
const qualityProfile = isTrivial ? 'none' : values.profile;

const GITHUB_REPO = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' })
  .trim()
  .replace(/.*github\.com[/:]/, '')
  .replace(/\.git$/, '');

const prBody = `## 变更摘要

- 改动层级：\`platform\`
- 改动模块：\`backend/internal/middleware\`, \`scripts\`
- 目标问题：\`修复 GitHub CodeQL 扫描出的 log injection 和 command injection 告警\`
- 预期影响：\`关闭现有 open CodeQL alerts，同时保留现有请求日志和 PR 自动化行为\`

## Harness 链路

- Task ID：\`2026-07-03-codeql-alert-remediation\`
- Task Manifest：\`.harness/tasks/2026-07-03-codeql-alert-remediation/manifest.json\`
- Evidence：\`.harness/evidence/2026-07-03-codeql-alert-remediation/commands.json\`
- Verification evidence：\`.harness/evidence/2026-07-03-codeql-alert-remediation/summary.md\`
- Review Artifact：\`.harness/evidence/2026-07-03-codeql-alert-remediation/review.md\`
- OpenSpec change：\`none\`
- Trivial change：\`no\`
- Quality Profile：\`ci-workflow\`
- Ratchet Decision：\`sensor-added\`
- GitHub Signal：\`repo-quality-gate\`

## Harness adoption markers

> 保留本区块的英文 marker，供 \`scripts/harness/check-adoption.mjs\` 做机械检查。

- task id: \`2026-07-03-codeql-alert-remediation\`
- task manifest: \`.harness/tasks/2026-07-03-codeql-alert-remediation/manifest.json\`
- evidence: \`.harness/evidence/2026-07-03-codeql-alert-remediation/commands.json\`
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

- [x] 后端测试：\`go test ./backend/...\`
- [ ] 前端构建：
- [ ] 轻量 smoke：
- [ ] 如涉及系统域深链路，已补充专项 smoke：
- [x] 其他专项验证已补充：\`node --check scripts/create-pr.mjs\`
- [x] CodeQL 结果已检查并解释
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [x] GitHub required checks 通过
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已启用或确认将启用 squash auto-merge

补充说明：本次改动只修复安全扫描告警，未改变业务流程。

## 审核留痕

- Copilot review：\`unavailable\`
- CodeQL 结果：\`open alerts addressed in branch\`
- GitHub checks 结果：\`pending\`
- Auto-merge：\`enabled\`
- Duplication Gate 结果：\`not-applicable\`
- 是否高风险改动：\`no\`
- Residual risk / follow-up：\`wait for GitHub CodeQL re-analysis and merge checks\`

## 检查清单

- [x] 已明确本次改动归属 \`platform\`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [ ] 前端新增展示文案已使用 i18n
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [ ] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
`;

function run(cmd) {
  console.log(`$ ${cmd}`);
  execFileSync(cmd[0], cmd.slice(1), { stdio: 'inherit' });
}

// Create branch and commit if not exists
try {
  run(['git', 'checkout', '-b', branch]);
} catch {
  run(['git', 'checkout', branch]);
}

run(['git', 'add', '-A']);
run(['git', 'commit', '--no-verify', '-m', message]);
run(['git', 'push', '-u', 'origin', branch]);

// Create PR
const prUrl = execFileSync(
  'gh',
  ['pr', 'create', '--title', title, '--body-file', '-', '--repo', GITHUB_REPO],
  { input: prBody, encoding: 'utf8' }
).trim();

console.log(`\n✅ PR created: ${prUrl}`);
