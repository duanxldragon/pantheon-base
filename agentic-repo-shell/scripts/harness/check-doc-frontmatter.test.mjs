import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  parseFrontmatter,
  validateDoc,
  parseContractBodyReferences,
  extractReadmeMainEntryLinks,
  runCheck,
} from './check-doc-frontmatter.mjs';

test('parseFrontmatter reads array fields', () => {
  const parsed = parseFrontmatter(`---\ntitle: Example\ndoc_type: Design\nlayer: platform\nstatus: Active\nlinked_contracts:\n  - docs/contracts/PLATFORM_CONTRACT.md\nupdated_at: 2026-05-18\n---\n`);
  assert.equal(parsed.data.title, 'Example');
  assert.deepEqual(parsed.data.linked_contracts, ['docs/contracts/PLATFORM_CONTRACT.md']);
});

test('validateDoc requires linked contracts for design docs', () => {
  const result = validateDoc({
    filePath: 'docs/designs/example.md',
    data: { title: 'Example', doc_type: 'Design', layer: 'platform', status: 'Active', updated_at: '2026-05-18' },
    repoRoot: process.cwd(),
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /linked_contracts/);
});

test('parseContractBodyReferences groups by section', () => {
  const parsed = parseContractBodyReferences('关联设计：\n- `A.md`\n\n关联验收：\n- `B.md`\n');
  assert.deepEqual(parsed.byField.related_designs, ['A.md']);
  assert.deepEqual(parsed.byField.related_acceptances, ['B.md']);
});

test('extractReadmeMainEntryLinks captures only main entry links', () => {
  const links = extractReadmeMainEntryLinks('## 2. Main\n[A](./designs/A.md)\n## 5. Archive\n[B](./archive/B.md)\n');
  assert.deepEqual(links, ['./designs/A.md']);
});

test('runCheck catches README links to non-active docs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-frontmatter-'));
  fs.mkdirSync(path.join(root, 'docs', 'designs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'contracts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'README.md'), '## 2. Main\n[Draft](./designs/A.md)\n');
  fs.writeFileSync(
    path.join(root, 'docs', 'designs', 'A.md'),
    '---\ntitle: A\ndoc_type: Design\nlayer: platform\nstatus: Draft\nlinked_contracts:\n  - docs/contracts/C.md\nupdated_at: 2026-05-18\n---\n',
  );
  fs.writeFileSync(
    path.join(root, 'docs', 'contracts', 'C.md'),
    '---\ntitle: C\ndoc_type: Contract\nlayer: platform\nstatus: Active\nupdated_at: 2026-05-18\n---\n# C\n',
  );
  const result = runCheck(root);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /main entry link must target Active docs only/);
});
