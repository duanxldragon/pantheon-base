import { defineModule } from '../../../core/router/types';

export const MdqaorderModule = defineModule({
  name: 'mdqaorder',
  scope: 'business',
  routes: [
    {
      path: 'business/mdqaorder',
      routeName: 'business-mdqaorder',
      titleKey: 'business.mdqaorder.title',
      icon: 'apps',
      pagePermission: 'business:mdqaorder:list',
      componentKey: 'business/mdqaorder/MdqaorderList',
    },
    {
      path: 'business/mdqaorder/:id',
      routeName: 'business-mdqaorder-detail',
      titleKey: 'business.mdqaorder.title',
      pagePermission: 'business:mdqaorder:view',
      activeMenu: '/business/mdqaorder',
      componentKey: 'business/mdqaorder/MdqaorderDetail',
    },
  ],
  menus: [
    { path: '/business/mdqaorder', titleKey: 'business.mdqaorder.title', icon: 'apps', routeName: 'business-mdqaorder', module: 'business.mdqaorder' },
  ],
  dashboardWidgets: [
    {
      key: 'business:mdqaorder',
      slot: 'quick-action',
      sourceDomain: 'business/mdqaorder',
      titleKey: 'business.mdqaorder.title',
      descriptionKey: 'business.mdqaorder.dashboard.quickAction',
      path: '/business/mdqaorder',
      permission: 'business:mdqaorder:list',
      icon: 'apps',
      cleanupPolicy: 'remove_with_source_module',
      registrationOwner: 'business.mdqaorder',
    },
  ],
  permissions: [
    'business:mdqaorder:list',
    'business:mdqaorder:view',
    'business:mdqaorder:create',
    'business:mdqaorder:update',
    'business:mdqaorder:delete'
  ],
  i18nNamespaces: ['business.mdqaorder'],
});
