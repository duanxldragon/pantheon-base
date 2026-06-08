#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const options = { root: process.cwd(), config: 'agentic-method-kit/config/method.config.json' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') options.root = path.resolve(argv[++i]);
    if (arg === '--config') options.config = argv[++i];
  }
  return options;
}

function loadConfig(root, configPath) {
  return JSON.parse(fs.readFileSync(path.join(root, configPath), 'utf8'));
}

function listActiveChanges(root, config) {
  const dir = path.join(root, config.openSpecChangesDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'archive')
    .map((e) => `${config.openSpecChangesDir}/${e.name}/`);
}

function validate(root, config) {
  const findings = [];
  const prTemplate = path.join(root, config.pullRequestTemplate);
  if (!fs.existsSync(prTemplate)) findings.push('missing pull request template');
  const activeChanges = listActiveChanges(root, config);
  return { findings, activeChanges };
}

const options = parseArgs(process.argv.slice(2));
const config = loadConfig(options.root, options.config);
const result = validate(options.root, config);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.findings.length > 0 ? 1 : 0;
