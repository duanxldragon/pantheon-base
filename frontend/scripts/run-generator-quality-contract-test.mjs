import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { prepareTranspiledWorkspace } from './transpile-typescript-files.mjs';

const files = [
  'src/modules/system/generator/schema.ts',
  'src/modules/system/generator/typeMapping.ts',
  'src/modules/system/generator/backendGenerator.ts',
  'src/modules/system/generator/frontendGenerator.ts',
  'src/modules/system/generator/exporter.ts',
  'tests/generator/generator-quality-contract.test.ts',
];

const { tempDir } = prepareTranspiledWorkspace('generator-quality-contract-test', files);
await import(pathToFileURL(join(tempDir, 'tests', 'generator', 'generator-quality-contract.test.js')));
