import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadResourceModule } from './lib/load-resource-module.mjs';

const currentFilePath = fileURLToPath(import.meta.url);
const frontendRoot = path.resolve(path.dirname(currentFilePath), '..');
const repoRoot = path.resolve(frontendRoot, '..');
const schemaGeneratedRoot = path.join(repoRoot, 'schema', 'generated');
const generatedResourcesRoot = path.join(frontendRoot, 'src', 'i18n', 'resources', 'generated');
const LOCALES = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR'];
const GENERATED_SCHEMA_LOCALES = ['zh', 'en'];

function collectGeneratedSchemaFiles(rootPath) {
  const files = [];
  if (!fs.existsSync(rootPath)) {
    return files;
  }

  const pending = [rootPath];
  while (pending.length > 0) {
    const currentDir = pending.pop();
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        pending.push(fullPath);
        continue;
      }
      if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.json') {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function addTranslationKeys(allowedKeys, translations) {
  for (const locale of GENERATED_SCHEMA_LOCALES) {
    for (const key of Object.keys(translations?.[locale] || {})) {
      if (key.trim()) {
        allowedKeys.add(key);
      }
    }
  }
}

function collectGeneratedSchemaKeys() {
  const allowedKeys = new Set();
  for (const fullPath of collectGeneratedSchemaFiles(schemaGeneratedRoot)) {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const schema = JSON.parse(raw);
    addTranslationKeys(allowedKeys, schema?.i18n?.translations);
  }
  return allowedKeys;
}

function main() {
  const allowedKeys = collectGeneratedSchemaKeys();
  const violations = [];

  for (const locale of LOCALES) {
    const resourcePath = path.join(generatedResourcesRoot, `${locale}.ts`);
    if (!fs.existsSync(resourcePath)) {
      continue;
    }
    const resource = loadResourceModule(resourcePath);
    for (const key of Object.keys(resource)) {
      if (!allowedKeys.has(key)) {
        violations.push({ locale, key });
      }
    }
  }

  if (violations.length === 0) {
    console.log('Generated i18n scope check passed.');
    return;
  }

  console.error('Generated i18n files contain keys that do not belong to schema/generated.');
  console.error('Move these keys into base or override resources instead of frontend/src/i18n/resources/generated/.');
  violations.slice(0, 50).forEach(({ locale, key }) => {
    console.error(`  - [${locale}] ${key}`);
  });
  if (violations.length > 50) {
    console.error(`  ... ${violations.length - 50} more`);
  }
  process.exitCode = 1;
}

main();
