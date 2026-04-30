import { defineModule } from '../../../core/router/types';

export const SettingModule = defineModule({
  name: 'setting',
  scope: 'system',
  routes: [
    {
      path: 'system/setting',
      routeName: 'system-setting',
      titleKey: 'system.menu.setting',
      icon: 'settings',
      pagePermission: 'system:setting:list',
      componentKey: 'system/setting/SettingPage',
    },
  ],
  menus: [
    { path: '/system/setting', titleKey: 'system.menu.setting', icon: 'settings', routeName: 'system-setting', module: 'system.config' },
  ],
  permissions: [
    'system:setting:list',
    'system:setting:update',
    'system:setting:refresh',
    'system:setting:export',
  ],
  i18nNamespaces: ['system.setting', 'system.menu'],
});
