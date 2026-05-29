import type { ModuleConfig } from '../../core/router/types';
import { MdqaorderModule } from '../business/mdqaorder';
import { MdqaorderitemModule } from '../business/mdqaorderitem';


export const generatedBusinessModules: ModuleConfig[] = [
  MdqaorderModule,
  MdqaorderitemModule,
];
