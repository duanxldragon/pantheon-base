import { defineModule } from '../../../core/router/types';

export const RoleModule = defineModule({
  name: 'role',
  scope: 'system',
  routes: [
    {
      path: 'system/role',
      routeName: 'system-role',
      titleKey: 'system.menu.role',
      icon: 'safe',
      pagePermission: 'system:role:list',
      componentKey: 'system/role/RoleList',
    },
  ],
  menus: [
    { path: '/system/role', titleKey: 'system.menu.role', icon: 'safe', routeName: 'system-role', module: 'system.iam' },
  ],
  permissions: [
    'system:role:list',
    'system:role:create',
    'system:role:update',
    'system:role:delete',
    'system:role:batch-update',
    'system:role:export',
  ],
  i18nNamespaces: ['system.role', 'system.menu'],
});
