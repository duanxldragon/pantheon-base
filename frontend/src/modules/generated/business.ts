import type { ModuleConfig } from '../../core/router/types';
import { CmdbHostModule } from '../business/cmdb/host';
import { CmdbVendorModule } from '../business/cmdb/vendor';

export const generatedBusinessModules: ModuleConfig[] = [
  CmdbHostModule,
  CmdbVendorModule,
];
