import { defineModule } from '../../../../core/router/types';

export const TenantModule = defineModule({
  name: 'tenant',
  scope: 'system',
  routes: [
    {
      path: 'system/tenant',
      routeName: 'system-tenant',
      titleKey: 'system.menu.tenant',
      icon: 'storage',
      pagePermission: 'system:tenant:list',
      componentKey: 'system/tenant/TenantList',
    },
  ],
  menus: [
    {
      path: '/system/tenant',
      titleKey: 'system.menu.tenant',
      icon: 'storage',
      routeName: 'system-tenant',
      module: 'system.tenant',
    },
  ],
  permissions: [
    'system:tenant:list',
    'system:tenant:create',
    'system:tenant:update',
    'system:tenant:delete',
    'system:tenant:member-add',
    'system:tenant:member-remove',
  ],
  i18nNamespaces: ['system.tenant', 'system.menu'],
});
