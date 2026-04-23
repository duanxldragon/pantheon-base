import { matchPath } from 'react-router-dom';
import type { ModuleConfig } from './types';
import { getRegisteredComponent } from './componentRegistry';
import { AuthModule } from '../../modules/auth';
import { DashboardModule } from '../../modules/dashboard';
import { DictModule } from '../../modules/system/dict';
import { DeptModule } from '../../modules/system/dept';
import { MenuModule } from '../../modules/system/menu';
import { PermissionModule } from '../../modules/system/permission';
import { ProfileModule } from '../../modules/system/profile';
import { PostModule } from '../../modules/system/post';
import { RoleModule } from '../../modules/system/role';
import { SettingModule } from '../../modules/system/setting';
import { AuditModule } from '../../modules/system/audit';
import { UserModule } from '../../modules/system/user';
import { CMDBModule } from '../../modules/business/cmdb';

export const systemModules: ModuleConfig[] = [
  DashboardModule,
  AuthModule,
  ProfileModule,
  DictModule,
  DeptModule,
  PostModule,
  PermissionModule,
  UserModule,
  RoleModule,
  MenuModule,
  SettingModule,
  AuditModule,
];

export const businessModules: ModuleConfig[] = [
  CMDBModule,
];

export const registeredModules: ModuleConfig[] = [
  ...systemModules,
  ...businessModules,
];

export const systemRoutes = registeredModules.flatMap((module) => module.routes.map((route) => {
  const component = route.component ?? getRegisteredComponent(route.componentKey);
  if (!component) {
    throw new Error(`Unresolved route component for path "${route.path}"`);
  }
  return {
    ...route,
    component,
  };
}));

export const systemModuleMenus = registeredModules.flatMap((module) => module.menus || []);

export const systemModulePermissions = registeredModules.flatMap((module) => module.permissions || []);

export const systemModuleI18nNamespaces = registeredModules.flatMap((module) => module.i18nNamespaces || []);

export const systemRouteTitleMap = systemRoutes.reduce<Record<string, string>>((acc, route) => {
  acc[`/${route.path}`] = route.titleKey;
  return acc;
}, {});

export function findRouteByPath(pathname: string) {
  return systemRoutes.find((route) => matchPath({ path: `/${route.path}`, end: true }, pathname));
}
