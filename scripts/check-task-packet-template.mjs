import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

const requiredFiles = [
  'docs/README.md',
  'docs/README.en.md',
  'docs/acceptances/TASK_PACKET_BASE_TEMPLATE.md',
  'docs/acceptances/TASK_PACKET_BASE_TEMPLATE.en.md',
];

const requiredMarkers = {
  'docs/README.md': [
    'TASK_PACKET_BASE_TEMPLATE.md',
  ],
  'docs/README.en.md': [
    'acceptances/TASK_PACKET_BASE_TEMPLATE.md',
  ],
  'docs/acceptances/TASK_PACKET_BASE_TEMPLATE.md': [
    '目标仓库：pantheon-base',
    '同步要求：',
    '如果共享能力会影响 pantheon-ops，只记录',
  ],
  'docs/acceptances/TASK_PACKET_BASE_TEMPLATE.en.md': [
    'Target repo: pantheon-base',
    'Sync expectation:',
    '`base -> ops` sync is required',
  ],
};

const findings = [];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    findings.push(`${relativePath}: required task-packet template file is missing`);
    continue;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const marker of requiredMarkers[relativePath] ?? []) {
    if (!content.includes(marker)) {
      findings.push(`${relativePath}: missing required marker: ${marker}`);
    }
  }
}

if (findings.length > 0) {
  console.error('Pantheon Base task-packet template check failed');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log('OK pantheon-base task-packet template is present and linked');
