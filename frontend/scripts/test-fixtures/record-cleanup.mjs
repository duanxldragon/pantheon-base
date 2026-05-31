import fs from 'node:fs';
import process from 'node:process';

const markerPath = process.env.PANTHEON_CLEANUP_MARKER;

if (markerPath) {
  const payload = JSON.stringify({
    args: process.argv.slice(2),
    preserve: process.env.PANTHEON_SMOKE_PRESERVE_FIXTURES ?? '',
  });
  fs.appendFileSync(markerPath, `${payload}\n`, 'utf8');
}

process.exit(0);