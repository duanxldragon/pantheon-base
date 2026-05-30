import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { prepareTranspiledWorkspace } from './transpile-typescript-files.mjs';
const schemaPath = process.argv[2];

if (!schemaPath) {
  throw new Error('schema path required');
}

const files = [
  'src/modules/system/generator/schema.ts',
  'src/modules/system/generator/type-mapping.ts',
  'src/modules/system/generator/backend-generator.ts',
  'src/modules/system/generator/frontend-generator.ts',
  'src/modules/system/generator/exporter.ts',
];

const { tempDir } = prepareTranspiledWorkspace('generator-server-export', files);

const { ModuleExporter } = await import(
  pathToFileURL(join(tempDir, 'src', 'modules', 'system', 'generator', 'exporter.js'))
);

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const exporter = new ModuleExporter(schema);
process.stdout.write(JSON.stringify(exporter.generateAll()));
