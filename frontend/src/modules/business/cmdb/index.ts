import { defineModule } from '../../../core/router/types';

export const CMDBModule = defineModule({
  name: 'cmdb',
  scope: 'business',
  routes: [
    {
      path: 'business/cmdb/types',
      routeName: 'business-cmdb-types',
      titleKey: 'cmdb.menu.types',
      icon: 'list',
      pagePermission: 'business:cmdb:type:list',
      componentKey: 'business/cmdb/CMDBTypeList',
    },
    {
      path: 'business/cmdb/items',
      routeName: 'business-cmdb-items',
      titleKey: 'cmdb.menu.items',
      icon: 'storage',
      pagePermission: 'business:cmdb:item:list',
      componentKey: 'business/cmdb/CMDBItemList',
    },
    {
      path: 'business/cmdb/items/:id',
      routeName: 'business-cmdb-item-detail',
      titleKey: 'cmdb.item.detail',
      pagePermission: 'business:cmdb:item:view',
      activeMenu: '/business/cmdb/items',
      componentKey: 'business/cmdb/CMDBItemDetail',
    },
  ],
  menus: [
    { path: '/business/cmdb/types', titleKey: 'cmdb.menu.types', icon: 'list', routeName: 'business-cmdb-types', module: 'business.cmdb' },
    { path: '/business/cmdb/items', titleKey: 'cmdb.menu.items', icon: 'storage', routeName: 'business-cmdb-items', module: 'business.cmdb' },
  ],
  permissions: [
    'business:cmdb:type:list',
    'business:cmdb:type:create',
    'business:cmdb:type:update',
    'business:cmdb:type:delete',
    'business:cmdb:type:export',
    'business:cmdb:type:import',
    'business:cmdb:item:list',
    'business:cmdb:item:view',
    'business:cmdb:item:create',
    'business:cmdb:item:update',
    'business:cmdb:item:delete',
    'business:cmdb:item:export',
    'business:cmdb:item:import',
    'business:cmdb:relation:create',
    'business:cmdb:relation:delete',
  ],
  i18nNamespaces: ['business.cmdb'],
});
