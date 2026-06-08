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

function discoverEvidenceFiles(root, config) {
  const result = [];
  const base = path.join(root, config.evidenceDir);
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      if (entry.isFile() && entry.name === 'commands.json') result.push(full);
    }
  }
  walk(base);
  return result;
}

function validate(filePath, root) {
  const errors = [];
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!payload.taskId) errors.push('missing taskId');
  if (!payload.linkage) errors.push('missing linkage');
  if (payload.linkage) {
    const expectedDir = path.relative(root, path.dirname(filePath)).replaceAll(path.sep, '/') + '/';
    if (payload.linkage.evidenceDir !== expectedDir) errors.push('linkage evidenceDir mismatch');
    if (payload.linkage.taskPacket && !fs.existsSync(path.join(root, payload.linkage.taskPacket))) errors.push('linked task packet missing');
    if (payload.linkage.reviewFile) {
      if (payload.linkage.reviewFile === 'none') {
        errors.push('linkage reviewFile must not be none');
      } else if (!fs.existsSync(path.join(root, payload.linkage.reviewFile))) {
        errors.push('linked review file missing');
      }
    }
  }
  if ('graphChecks' in payload) {
    if (typeof payload.graphChecks !== 'object' || payload.graphChecks === null || Array.isArray(payload.graphChecks)) {
      errors.push('graphChecks must be an object when present');
    } else {
      if ('usedCodeGraph' in payload.graphChecks && typeof payload.graphChecks.usedCodeGraph !== 'boolean') {
        errors.push('graphChecks.usedCodeGraph must be boolean');
      }
      if ('checks' in payload.graphChecks) {
        const validChecks = new Set(['cycle', 'hub', 'call-depth', 'sensitive-flow']);
        if (!Array.isArray(payload.graphChecks.checks)) {
          errors.push('graphChecks.checks must be an array');
        } else {
          for (const entry of payload.graphChecks.checks) {
            if (typeof entry !== 'string' || !validChecks.has(entry)) {
              errors.push('graphChecks.checks contains invalid value');
              break;
            }
          }
        }
      }
    }
  }
  return { file: path.relative(root, filePath).replaceAll(path.sep, '/'), errors };
}

const options = parseArgs(process.argv.slice(2));
const config = loadConfig(options.root, options.config);
const results = discoverEvidenceFiles(options.root, config).map((f) => validate(f, options.root));
const errorCount = results.reduce((n, r) => n + r.errors.length, 0);
console.log(JSON.stringify({ errorCount, results }, null, 2));
process.exitCode = errorCount > 0 ? 1 : 0;
