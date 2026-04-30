import { defineModule } from '../../../core/router/types';

export const DeptModule = defineModule({
  name: 'dept',
  scope: 'system',
  routes: [
    {
      path: 'system/dept',
      routeName: 'system-dept',
      titleKey: 'system.menu.dept',
      icon: 'branch',
      pagePermission: 'system:dept:list',
      componentKey: 'system/dept/DeptList',
    },
  ],
  menus: [
    { path: '/system/dept', titleKey: 'system.menu.dept', icon: 'branch', routeName: 'system-dept', module: 'system.org' },
  ],
  permissions: [
    'system:dept:list',
    'system:dept:create',
    'system:dept:update',
    'system:dept:delete',
    'system:dept:export',
    'system:dept:import',
    'system:dept:batch-update',
  ],
  i18nNamespaces: ['system.dept', 'system.menu', 'system.permission'],
});
