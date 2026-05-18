import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOC_GLOBS = [
  'docs/superpowers/specs',
  'docs/archive/examples',
  'docs/archive/baselines',
  'docs/archive/upgrade',
];

const REQUIRED_BASE_FIELDS = ['title', 'doc_type', 'layer', 'status', 'updated_at'];
const REQUIRED_RETAINED_FIELDS = ['index_group', 'retention_reason', 'linked_contracts'];

function walkMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

export function parseFrontmatter(source) {
  const lines = source.split(/\r?\n/);
  if (lines[0] !== '---') {
    return { data: null, body: source, hasFrontmatter: false };
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line === '---');
  if (closingIndex === -1) {
    return { data: null, body: source, hasFrontmatter: false };
  }

  const frontmatterLines = lines.slice(1, closingIndex);
  const data = {};
  let currentArrayKey = null;

  for (const line of frontmatterLines) {
    if (!line.trim()) continue;

    const arrayItemMatch = line.match(/^\s*-\s+(.*)$/);
    if (arrayItemMatch) {
      if (!currentArrayKey) {
        throw new Error(`Array item found before array key: ${line}`);
      }
      data[currentArrayKey].push(arrayItemMatch[1].trim());
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!keyMatch) {
      throw new Error(`Unsupported frontmatter line: ${line}`);
    }

    const [, key, rawValue] = keyMatch;
    if (rawValue === '') {
      data[key] = [];
      currentArrayKey = key;
      continue;
    }

    data[key] = rawValue.trim();
    currentArrayKey = null;
  }

  return {
    data,
    body: lines.slice(closingIndex + 1).join('\n'),
    hasFrontmatter: true,
  };
}

function expectedIndexGroup(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('docs/superpowers/specs/')) return 'superpowers-specs';
  if (normalized.startsWith('docs/archive/examples/')) return 'archive/examples';
  if (normalized.startsWith('docs/archive/baselines/')) return 'archive/baselines';
  if (normalized.startsWith('docs/archive/upgrade/')) return 'archive/upgrade';
  return null;
}

function expectedStatuses(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('docs/superpowers/specs/')) return new Set(['Approved', 'Superseded']);
  if (normalized.startsWith('docs/archive/examples/')) return new Set(['Archived']);
  if (normalized.startsWith('docs/archive/baselines/')) return new Set(['Archived', 'Superseded']);
  if (normalized.startsWith('docs/archive/upgrade/')) return new Set(['Archived']);
  return null;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

export function validateDoc({ filePath, data, repoRoot }) {
  const errors = [];

  for (const field of REQUIRED_BASE_FIELDS) {
    if (!isNonEmptyString(data[field])) {
      errors.push(`${filePath}: missing or empty required field "${field}"`);
    }
  }

  const expectedGroup = expectedIndexGroup(filePath);
  if (expectedGroup) {
    for (const field of REQUIRED_RETAINED_FIELDS) {
      if (field === 'linked_contracts') {
        if (!isNonEmptyArray(data[field])) {
          errors.push(`${filePath}: missing or empty required field "${field}"`);
        }
      } else if (!isNonEmptyString(data[field])) {
        errors.push(`${filePath}: missing or empty required field "${field}"`);
      }
    }

    if (data.index_group && data.index_group !== expectedGroup) {
      errors.push(`${filePath}: index_group "${data.index_group}" does not match expected "${expectedGroup}"`);
    }

    const allowedStatuses = expectedStatuses(filePath);
    if (data.status && allowedStatuses && !allowedStatuses.has(data.status)) {
      errors.push(`${filePath}: status "${data.status}" is not allowed for this directory`);
    }
  }

  if (data.linked_contracts !== undefined) {
    if (!Array.isArray(data.linked_contracts)) {
      errors.push(`${filePath}: linked_contracts must be a YAML array`);
    } else {
      for (const linkedPath of data.linked_contracts) {
        const absolute = path.resolve(repoRoot, linkedPath);
        if (!fs.existsSync(absolute)) {
          errors.push(`${filePath}: linked contract path does not exist: ${linkedPath}`);
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function checkFile(filePath, repoRoot) {
  const source = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');

  let parsed;
  try {
    parsed = parseFrontmatter(source);
  } catch (error) {
    return {
      ok: false,
      errors: [`${relativePath}: failed to parse frontmatter: ${error.message}`],
    };
  }

  if (!parsed.hasFrontmatter) {
    return {
      ok: false,
      errors: [`${relativePath}: missing YAML frontmatter block`],
    };
  }

  return validateDoc({
    filePath: relativePath,
    data: parsed.data ?? {},
    repoRoot,
  });
}

export function runCheck(repoRoot = process.cwd()) {
  const files = DOC_GLOBS.flatMap((dir) => walkMarkdownFiles(path.resolve(repoRoot, dir)));
  const errors = [];

  for (const filePath of files) {
    const result = checkFile(filePath, repoRoot);
    if (!result.ok) {
      errors.push(...result.errors);
    }
  }

  return {
    ok: errors.length === 0,
    checkedFiles: files.length,
    errors,
  };
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const result = runCheck();
  if (!result.ok) {
    console.error(`Frontmatter check failed. Checked ${result.checkedFiles} files.`);
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Frontmatter check passed. Checked ${result.checkedFiles} files.`);
}
