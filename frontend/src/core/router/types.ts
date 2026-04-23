import type { LazyExoticComponent, ComponentType } from 'react';
import type { RegisteredComponentKey } from './componentRegistry';

export type ModuleScope = 'platform' | 'system' | 'business';

interface ModuleRouteConfigBase {
  path: string;
  routeName?: string;
  titleKey: string;
  icon?: string;
  isCache?: boolean;
  activeMenu?: string;
  pagePermission?: string;
}

export type ModuleRouteConfig = ModuleRouteConfigBase & (
  | {
    component: LazyExoticComponent<ComponentType>;
    componentKey?: RegisteredComponentKey;
  }
  | {
    component?: undefined;
    componentKey: RegisteredComponentKey;
  }
);

export interface ModuleMenuMeta {
  titleKey: string;
  path: string;
  icon?: string;
  routeName?: string;
  module?: string;
  isCache?: boolean;
  isExternal?: boolean;
  activeMenu?: string;
}

export interface ModuleConfig {
  name: string;
  scope: ModuleScope;
  routes: ModuleRouteConfig[];
  menus?: ModuleMenuMeta[];
  permissions?: string[];
  i18nNamespaces?: string[];
  featureFlags?: string[];
}

export function defineModule(config: ModuleConfig): ModuleConfig {
  return config;
}
