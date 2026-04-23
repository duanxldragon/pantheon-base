import { lazy, type LazyExoticComponent, type ComponentType } from 'react';

const componentRegistry = {
  'dashboard': lazy(() => import('../../modules/dashboard/Dashboard')),
  'auth/SecurityCenter': lazy(() => import('../../modules/auth/SecurityCenter')),
  'auth/LoginLogList': lazy(() => import('../../modules/auth/LoginLogList')),
  'auth/SessionList': lazy(() => import('../../modules/auth/SessionList')),
  'system/profile/ProfileCenter': lazy(() => import('../../modules/system/profile/ProfileCenter')),
  'system/dict/DictPage': lazy(() => import('../../modules/system/dict/DictPage')),
  'system/dept/DeptList': lazy(() => import('../../modules/system/dept/DeptList')),
  'system/menu/MenuList': lazy(() => import('../../modules/system/menu/MenuList')),
  'system/permission/PermissionList': lazy(() => import('../../modules/system/permission/PermissionList')),
  'system/post/PostList': lazy(() => import('../../modules/system/post/PostList')),
  'system/role/RoleList': lazy(() => import('../../modules/system/role/RoleList')),
  'system/setting/SettingPage': lazy(() => import('../../modules/system/setting/SettingPage')),
  'system/user/UserList': lazy(() => import('../../modules/system/user/UserList')),
  'system/user/UserDetail': lazy(() => import('../../modules/system/user/UserDetail')),
  'system/audit/OperationLogList': lazy(() => import('../../modules/system/audit/OperationLogList')),
  'business/cmdb/CMDBTypeList': lazy(() => import('../../modules/business/cmdb/CMDBTypeList')),
  'business/cmdb/CMDBItemList': lazy(() => import('../../modules/business/cmdb/CMDBItemList')),
  'business/cmdb/CMDBItemDetail': lazy(() => import('../../modules/business/cmdb/CMDBItemDetail')),
} satisfies Record<string, LazyExoticComponent<ComponentType>>;

export type RegisteredComponentKey = keyof typeof componentRegistry;

export function getRegisteredComponent(key?: string) {
  if (!key) {
    return undefined;
  }
  return componentRegistry[key as RegisteredComponentKey];
}

export function isRegisteredComponentKey(key?: string): key is RegisteredComponentKey {
  if (!key) {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(componentRegistry, key);
}

export function listRegisteredComponentKeys(): RegisteredComponentKey[] {
  return Object.keys(componentRegistry) as RegisteredComponentKey[];
}
