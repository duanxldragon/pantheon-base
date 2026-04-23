import { defineModule } from '../../../core/router/types';

export const UserModule = defineModule({
  name: 'user',
  scope: 'system',
  routes: [
    {
      path: 'system/user',
      routeName: 'system-user',
      titleKey: 'system.menu.user',
      icon: 'user',
      pagePermission: 'system:user:list',
      componentKey: 'system/user/UserList',
    },
    {
      path: 'system/user/:id',
      routeName: 'system-user-detail',
      titleKey: 'system.user.detail',
      pagePermission: 'system:user:view',
      activeMenu: '/system/user',
      componentKey: 'system/user/UserDetail',
    },
  ],
  menus: [
    { path: '/system/user', titleKey: 'system.menu.user', icon: 'user', routeName: 'system-user', module: 'system.iam' },
  ],
  permissions: [
    'system:user:list',
    'system:user:view',
    'system:user:create',
    'system:user:update',
    'system:user:delete',
    'system:user:reset',
    'system:user:export',
    'system:user:import',
    'system:user:batch-update',
  ],
  i18nNamespaces: ['system.user', 'system.menu', 'auth'],
});
