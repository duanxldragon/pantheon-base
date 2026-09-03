#!/usr/bin/env node

/**
 * 架构边界检查脚本
 * 检测跨层依赖违规，确保架构分层清晰
 *
 * 检查项：
 * 1. business/* 不得直接依赖 system/* 内部实现（Service/Repository/Handler）
 * 2. system/* 各子域不得互相直接依赖内部实现
 * 3. 前端 modules/business 不得直接引用 modules/system 内部组件
 * 4. 验证模块注册表完整性
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(level, message) {
  const prefix = {
    error: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
  };
  console.log(`${prefix[level]} ${message}`);
}

function runRipgrep(pattern, paths, options = {}) {
  try {
    const typeFlag = options.type ? `-t ${options.type}` : '';
    const cmd = `rg -n --no-heading --color=never ${typeFlag} '${pattern}' ${paths.join(' ')}`;
    const output = execSync(cmd, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    if (error.status === 1) {
      return []; // No matches
    }
    throw error;
  }
}

function checkBackendBusinessToSystem() {
  log('info', 'Checking backend business/* → system/* violations...');

  const violations = [];

  // 检查 business 模块是否直接 import system 内部实现
  const forbiddenImports = [
    'modules/system/auth/(service|repository|handler)',
    'modules/system/iam/(service|repository|handler)',
    'modules/system/org/(service|repository|handler)',
    'modules/system/config/(service|repository|handler)',
  ];

  for (const pattern of forbiddenImports) {
    const matches = runRipgrep(
      `import.*".*${pattern}"`,
      ['backend/modules/business/'],
      { type: 'go' }
    );

    if (matches.length > 0) {
      violations.push({
        rule: 'business/* → system/* internal dependency',
        pattern,
        matches,
      });
    }
  }

  return violations;
}

function checkFrontendBusinessToSystem() {
  log('info', 'Checking frontend business/* → system/* violations...');

  const violations = [];

  // 检查前端 business 模块是否直接引用 system 内部组件
  const forbiddenImports = [
    'modules/system/[^/]+/components',
    'modules/system/[^/]+/hooks',
    'modules/system/[^/]+/utils',
  ];

  for (const pattern of forbiddenImports) {
    const matches = runRipgrep(
      `from ['"](../../)?${pattern}`,
      ['frontend/src/modules/business/'],
      { type: 'typescript' }
    );

    if (matches.length > 0) {
      violations.push({
        rule: 'frontend business/* → system/* internal dependency',
        pattern,
        matches: matches.slice(0, 5), // 只显示前 5 条
        hasMore: matches.length > 5,
      });
    }
  }

  return violations;
}

function checkSystemCrossDependency() {
  log('info', 'Checking system/* cross-domain violations...');

  const violations = [];

  // system 各子域不应直接依赖其他子域的内部实现
  const systemDomains = ['auth', 'iam', 'org', 'config', 'audit', 'i18n'];

  for (const domain of systemDomains) {
    const otherDomains = systemDomains.filter(d => d !== domain);

    for (const other of otherDomains) {
      const pattern = `modules/system/${other}/(service|repository|handler)`;
      const matches = runRipgrep(
        `import.*".*${pattern}"`,
        [`backend/modules/system/${domain}/`],
        { type: 'go' }
      );

      if (matches.length > 0) {
        violations.push({
          rule: `system/${domain} → system/${other} internal dependency`,
          pattern,
          matches: matches.slice(0, 3),
          hasMore: matches.length > 3,
        });
      }
    }
  }

  return violations;
}

function checkGeneratedRegistry() {
  log('info', 'Checking generated registry integrity...');

  const violations = [];

  // 检查后端 generated_registry.go 是否存在且非空
  const backendRegistry = resolve(projectRoot, 'backend/modules/business/generated_registry.go');
  if (!existsSync(backendRegistry)) {
    violations.push({
      rule: 'Generated registry missing',
      file: 'backend/modules/business/generated_registry.go',
      message: 'File does not exist',
    });
  } else {
    const content = readFileSync(backendRegistry, 'utf-8');
    if (content.includes('// Registry is empty') || content.length < 200) {
      violations.push({
        rule: 'Generated registry empty',
        file: 'backend/modules/business/generated_registry.go',
        message: 'Registry appears to be empty or cleared',
      });
    }
  }

  // 检查前端 generated registry
  const frontendRegistries = [
    'frontend/src/modules/generated/business.ts',
    'frontend/src/core/router/generatedComponentRegistry.ts',
  ];

  for (const registryPath of frontendRegistries) {
    const fullPath = resolve(projectRoot, registryPath);
    if (!existsSync(fullPath)) {
      violations.push({
        rule: 'Generated registry missing',
        file: registryPath,
        message: 'File does not exist',
      });
    } else {
      const content = readFileSync(fullPath, 'utf-8');
      if (content.includes('export const modules = []') || content.length < 100) {
        violations.push({
          rule: 'Generated registry empty',
          file: registryPath,
          message: 'Registry appears to be empty or cleared',
        });
      }
    }
  }

  return violations;
}

function main() {
  console.log(`\n${colors.blue}=== Pantheon Architecture Boundary Check ===${colors.reset}\n`);

  const allViolations = [
    ...checkBackendBusinessToSystem(),
    ...checkFrontendBusinessToSystem(),
    ...checkSystemCrossDependency(),
    ...checkGeneratedRegistry(),
  ];

  console.log('');

  if (allViolations.length === 0) {
    log('success', 'No architecture boundary violations found');
    console.log('');
    process.exit(0);
  }

  // 输出违规项
  let errorCount = 0;

  for (const violation of allViolations) {
    log('error', `${violation.rule}`);
    errorCount++;

    if (violation.file) {
      console.log(`  ${colors.yellow}File: ${violation.file}${colors.reset}`);
      console.log(`  ${colors.yellow}${violation.message}${colors.reset}`);
    }

    if (violation.matches) {
      console.log(`  ${colors.yellow}Pattern: ${violation.pattern}${colors.reset}`);
      console.log(`  ${colors.yellow}Found ${violation.matches.length} violations:${colors.reset}`);

      for (const match of violation.matches) {
        console.log(`    ${match}`);
      }

      if (violation.hasMore) {
        console.log(`    ${colors.blue}... and more${colors.reset}`);
      }
    }

    console.log('');
  }

  // 总结
  console.log(`${colors.blue}Summary:${colors.reset}`);
  console.log(`  Violations: ${errorCount}`);
  console.log('');

  log('error', 'Architecture boundary check failed');
  console.log('');
  console.log(`${colors.yellow}Fix:${colors.reset}`);
  console.log('  - business/* modules should only depend on public contracts from system/*');
  console.log('  - system/* domains should only depend on each other via public contracts');
  console.log('  - Use dependency injection or event-driven patterns for cross-domain communication');
  console.log('');

  process.exit(1);
}

main();
