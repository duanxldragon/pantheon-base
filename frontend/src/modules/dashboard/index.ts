import { defineModule } from '../../core/router/types';

export const DashboardModule = defineModule({
  name: 'dashboard',
  scope: 'platform',
  routes: [
    {
      path: 'dashboard',
      routeName: 'dashboard',
      titleKey: 'system.menu.dashboard',
      icon: 'dashboard',
      pagePermission: 'platform:dashboard:view',
      componentKey: 'dashboard',
    },
  ],
  menus: [
    { path: '/dashboard', titleKey: 'system.menu.dashboard', icon: 'dashboard', routeName: 'dashboard', module: 'platform' },
  ],
  permissions: ['platform:dashboard:view'],
  i18nNamespaces: ['dashboard', 'system.menu'],
});
