import { defineModule } from '../../../../core/router/types';

export const CmdbHostModule = defineModule({
  name: 'cmdb/host',
  scope: 'business',
  routes: [
    {
      path: 'business/cmdb/host',
      routeName: 'business-cmdb-host',
      titleKey: 'business.cmdb.host.title',
      icon: 'apps',
      pagePermission: 'business:cmdb:host:list',
      componentKey: 'business/cmdb/host/CmdbHostList',
    },
  ],
  menus: [
    { path: '/business/cmdb/host', titleKey: 'business.cmdb.host.title', icon: 'apps', routeName: 'business-cmdb-host', module: 'business.cmdb.host' },
  ],
  dashboardWidgets: [
    {
      key: 'business:cmdb:host',
      slot: 'quick-action',
      sourceDomain: 'business/cmdb',
      titleKey: 'business.cmdb.host.title',
      descriptionKey: 'business.cmdb.host.dashboard.quickAction',
      path: '/business/cmdb/host',
      permission: 'business:cmdb:host:list',
      icon: 'apps',
      cleanupPolicy: 'remove_with_source_module',
      registrationOwner: 'business.cmdb.host',
    },
  ],
  permissions: [
    'business:cmdb:host:list',
    'business:cmdb:host:view',
    'business:cmdb:host:create',
    'business:cmdb:host:update',
    'business:cmdb:host:delete',
    'business:cmdb:host:export',
    'business:cmdb:host:import'
  ],
  i18nNamespaces: ['business.cmdb.host'],
});
