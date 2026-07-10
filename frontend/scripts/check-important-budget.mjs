/**
 * `!important` budget guard for P2-5.
 *
 * The remaining `!important` declarations are load-bearing Arco-internal
 * overrides plus legitimate `prefers-reduced-motion` resets; ripping them out
 * blindly regresses the UI, so the roadmap treats reduction as incremental
 * ("停止新增 + 逐步降"). This guard operationalises that: it fails if the total
 * count grows beyond the recorded budget, so new code cannot silently add more,
 * and the budget can be ratcheted down as overrides are migrated to Arco CSS
 * variables. Lower BUDGET whenever you remove some — never raise it.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const BUDGET = 147;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

const root = path.join(process.cwd(), 'src');
let total = 0;
const perFile = [];
for (const file of walk(root)) {
  const count = (fs.readFileSync(file, 'utf8').match(/!important/g) || []).length;
  if (count > 0) {
    perFile.push([count, path.relative(process.cwd(), file)]);
    total += count;
  }
}

perFile.sort((a, b) => b[0] - a[0]);
for (const [count, file] of perFile) {
  console.log(`  ${String(count).padStart(4)}  ${file}`);
}
console.log(`\nTotal !important: ${total} / budget ${BUDGET}`);

if (total > BUDGET) {
  console.error(
    `\n!important budget exceeded (${total} > ${BUDGET}). ` +
      `Avoid new !important; prefer Arco CSS-variable customization.`,
  );
  process.exit(1);
}
if (total < BUDGET) {
  console.log(
    `Nice — ${BUDGET - total} below budget. Lower BUDGET in this script to ${total} to lock the win.`,
  );
}
console.log('!important budget check passed.');
