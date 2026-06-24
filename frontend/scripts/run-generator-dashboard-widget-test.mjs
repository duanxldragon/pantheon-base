import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { prepareTranspiledWorkspace } from './transpile-typescript-files.mjs';

const files = [
  'src/modules/system/generator/schema.ts',
  'src/modules/system/generator/typeMapping.ts',
  'src/modules/system/generator/frontendGenerator.ts',
  'tests/generator/frontend-generator.dashboard-widget.test.ts',
];

const { tempDir } = prepareTranspiledWorkspace('generator-dashboard-widget-test', files);
await import(pathToFileURL(join(tempDir, 'tests', 'generator', 'frontend-generator.dashboard-widget.test.js')));
