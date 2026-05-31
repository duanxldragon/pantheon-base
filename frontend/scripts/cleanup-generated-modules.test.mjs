import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checkDirty, cleanup } from './cleanup-generated-modules.mjs';

function createFixtureRepo() {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'pantheon-generated-modules-'));
  const generatedPaths = {
    backendBusinessDir: path.join(repoRoot, 'backend', 'modules', 'business'),
    frontendBusinessDir: path.join(repoRoot, 'frontend', 'src', 'modules', 'business'),
    schemaBusinessDir: path.join(repoRoot, 'schema', 'generated', 'business'),
    i18nDir: path.join(repoRoot, 'frontend', 'src', 'i18n', 'resources', 'generated'),
  };
  const registryFiles = {
    backendRegistry: path.join(repoRoot, 'backend', 'modules', 'business', 'generated_registry.go'),
    backendMenuRegistry: path.join(
      repoRoot,
      'backend',
      'modules',
      'system',
      'iam',
      'menu',
      'generated_component_registry.go',
    ),
    frontendBusinessRegistry: path.join(repoRoot, 'frontend', 'src', 'modules', 'generated', 'business.ts'),
    frontendComponentRegistry: path.join(
      repoRoot,
      'frontend',
      'src',
      'core',
      'router',
      'generatedComponentRegistry.ts',
    ),
  };

  for (const dir of [...Object.values(generatedPaths), path.dirname(registryFiles.backendMenuRegistry), path.dirname(registryFiles.frontendBusinessRegistry), path.dirname(registryFiles.frontendComponentRegistry)]) {
    mkdirSync(dir, { recursive: true });
  }

  return { repoRoot, generatedPaths, registryFiles };
}

test('checkDirty returns no issues for clean generated artifacts', () => {
  const { repoRoot, generatedPaths, registryFiles } = createFixtureRepo();
  try {
    writeFileSync(registryFiles.backendRegistry, 'package business\n', 'utf8');
    writeFileSync(registryFiles.backendMenuRegistry, 'package iam\n', 'utf8');
    writeFileSync(registryFiles.frontendBusinessRegistry, 'export const generatedBusinessModules = [];\n', 'utf8');
    writeFileSync(registryFiles.frontendComponentRegistry, 'export const generatedComponentRegistry = {};\n', 'utf8');
    writeFileSync(path.join(generatedPaths.i18nDir, 'zh-CN.ts'), 'const generatedzhCNFallback = {};\n', 'utf8');

    const dirty = checkDirty(generatedPaths, registryFiles, repoRoot);
    assert.deepEqual(dirty, []);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('checkDirty detects generated module leftovers by prefix and content markers', () => {
  const { repoRoot, generatedPaths, registryFiles } = createFixtureRepo();
  try {
    mkdirSync(path.join(generatedPaths.backendBusinessDir, 'mdqa-order'), { recursive: true });
    writeFileSync(path.join(generatedPaths.schemaBusinessDir, 'mdqa-order.json'), '{}\n', 'utf8');
    writeFileSync(
      registryFiles.backendRegistry,
      'import (\n\t"pantheon-platform/backend/modules/business/mdqaorder"\n)\n',
      'utf8',
    );
    writeFileSync(
      registryFiles.frontendBusinessRegistry,
      "import './business/mdqaorder';\nexport const generatedBusinessModules = [];\n",
      'utf8',
    );

    const dirty = checkDirty(generatedPaths, registryFiles, repoRoot);

    assert.ok(dirty.some((item) => item.includes('backend generated_registry.go')));
    assert.ok(dirty.some((item) => item.includes('frontend generated/business.ts')));
    assert.ok(dirty.some((item) => item.includes('mdqa-order')));
    assert.ok(dirty.some((item) => item.includes('mdqa-order.json')));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('checkDirty detects any leftover business cmdb smoke directory', () => {
  const { repoRoot, generatedPaths, registryFiles } = createFixtureRepo();
  try {
    mkdirSync(path.join(generatedPaths.schemaBusinessDir, 'cmdb', 'host'), { recursive: true });

    const dirty = checkDirty(generatedPaths, registryFiles, repoRoot);

    assert.ok(dirty.some((item) => item.includes('schema/generated/business/cmdb')));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('cleanup removes generated leftovers and restores clean registry templates', () => {
  const { repoRoot, generatedPaths, registryFiles } = createFixtureRepo();
  const backendGeneratedDir = path.join(generatedPaths.backendBusinessDir, 'mdqa-order');
  const frontendGeneratedDir = path.join(generatedPaths.frontendBusinessDir, 'mdqa-order');
  const generatedSchemaPath = path.join(generatedPaths.schemaBusinessDir, 'mdqa-order.json');

  try {
    mkdirSync(backendGeneratedDir, { recursive: true });
    mkdirSync(frontendGeneratedDir, { recursive: true });
    writeFileSync(generatedSchemaPath, '{}\n', 'utf8');
    writeFileSync(
      registryFiles.backendRegistry,
      'import (\n\t"pantheon-platform/backend/modules/business/mdqaorder"\n)\n',
      'utf8',
    );
    writeFileSync(
      registryFiles.backendMenuRegistry,
      'var generatedMenuComponentKeys = map[string]struct{}{"business/mdqa-order": {}}\n',
      'utf8',
    );
    writeFileSync(
      registryFiles.frontendBusinessRegistry,
      "import './business/mdqaorder';\nexport const generatedBusinessModules = [];\n",
      'utf8',
    );
    writeFileSync(
      registryFiles.frontendComponentRegistry,
      "export const generatedComponentRegistry = {'business/mdqa-order': {}};\n",
      'utf8',
    );
    writeFileSync(
      path.join(generatedPaths.i18nDir, 'zh-CN.ts'),
      "const generatedzhCNFallback = {\n  'business.mdqa.order': '订单'\n};\nexport default generatedzhCNFallback;\n",
      'utf8',
    );
    mkdirSync(path.join(generatedPaths.schemaBusinessDir, 'cmdb', 'host'), { recursive: true });

    cleanup(generatedPaths, registryFiles);

    assert.equal(existsSync(backendGeneratedDir), false);
    assert.equal(existsSync(frontendGeneratedDir), false);
    assert.equal(existsSync(generatedSchemaPath), false);
    assert.equal(existsSync(path.join(generatedPaths.schemaBusinessDir, 'cmdb')), false);
    assert.deepEqual(checkDirty(generatedPaths, registryFiles, repoRoot), []);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});