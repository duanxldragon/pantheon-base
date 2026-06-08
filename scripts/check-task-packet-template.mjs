import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

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
    'Quality Profile:',
    'Ratchet Decision:',
    '同步要求：',
    '如果共享能力会影响 pantheon-ops，只记录',
  ],
  'docs/acceptances/TASK_PACKET_BASE_TEMPLATE.en.md': [
    'Target repo: pantheon-base',
    'Quality Profile:',
    'Ratchet Decision:',
    'Sync expectation:',
    '`base -> ops` sync is required',
  ],
};

export function validateTaskPacketTemplate(repoRoot = root) {
  const findings = [];

  for (const relativePath of requiredFiles) {
    const absolutePath = path.join(repoRoot, relativePath);
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

  return findings;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const findings = validateTaskPacketTemplate(root);

  if (findings.length > 0) {
    console.error('Pantheon Base task-packet template check failed');
    for (const finding of findings) {
      console.error(`- ${finding}`);
    }
    process.exit(1);
  }

  console.log('OK pantheon-base task-packet template is present and linked');
}
