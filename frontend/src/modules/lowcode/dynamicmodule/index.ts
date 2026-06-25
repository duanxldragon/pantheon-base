/**
 * 动态模块管理 - 模块注册
 */

import { defineModule } from '../../../core/router/types';

export const DynamicModuleModule = defineModule({
  name: 'dynamic-module',
  scope: 'lowcode',
  routes: [
    {
      path: 'lowcode/modules',
      routeName: 'lowcode-modules',
      titleKey: 'system.menu.modules',
      icon: 'apps',
      pagePermission: 'system:module:list',
      componentKey: 'lowcode/dynamicmodule/ModuleManager',
    },
  ],
  menus: [
    {
      path: '/lowcode/modules',
      titleKey: 'system.menu.modules',
      icon: 'apps',
      routeName: 'lowcode-modules',
      module: 'lowcode',
    },
  ],
  dashboardWidgets: [
    {
      key: 'platform.module-manager',
      slot: 'quick-action',
      sourceDomain: 'system/lowcode',
      titleKey: 'system.menu.modules',
      descriptionKey: 'dashboard.quickAction.moduleManager',
      path: '/lowcode/modules',
      permission: 'system:module:list',
      icon: 'apps',
      cleanupPolicy: 'hide_when_forbidden',
    },
    {
      key: 'platform.domain.lowcode',
      slot: 'domain-overview',
      sourceDomain: 'system/lowcode',
      titleKey: 'dashboard.domain.lowcode',
      descriptionKey: 'dashboard.domain.lowcodeDesc',
      path: '/lowcode/modules',
      permission: 'system:module:list',
      cleanupPolicy: 'hide_when_forbidden',
      summary: (summary, t) =>
        t('dashboard.lowcodeSummary', {
          modules: summary?.activeModuleCount ?? 0,
          i18n: summary?.totalI18nEntries ?? 0,
        }),
    },
  ],
  permissions: [
    'system:module:list',
    'system:module:register',
    'system:module:unregister',
    'system:module:delete_record',
    'system:module:purge',
    'system:module:repair',
  ],
  i18nNamespaces: ['system.dynamic-module', 'system.menu'],
});
