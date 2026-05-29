import { defineModule } from '../../../core/router/types';

export const MdqaorderModule = defineModule({
  name: 'mdqaorder',
  scope: 'business',
  routes: [
    {
      path: 'operations/mdqaorder',
      routeName: 'business-mdqaorder',
      titleKey: 'business.mdqaorder.title',
      icon: 'apps',
      pagePermission: 'business:mdqaorder:list',
      componentKey: 'business/mdqaorder/MdqaorderList',
    },
    {
      path: 'operations/mdqaorder/:id',
      routeName: 'business-mdqaorder-detail',
      titleKey: 'business.mdqaorder.title',
      pagePermission: 'business:mdqaorder:view',
      activeMenu: '/operations/mdqaorder',
      componentKey: 'business/mdqaorder/MdqaorderDetail',
    },
  ],
  menus: [
    { path: '/operations/mdqaorder', titleKey: 'business.mdqaorder.title', icon: 'apps', routeName: 'business-mdqaorder', module: 'business.mdqaorder' },
  ],
  dashboardWidgets: [
    {
      key: 'business:mdqaorder',
      slot: 'quick-action',
      sourceDomain: 'business/mdqaorder',
      titleKey: 'business.mdqaorder.title',
      descriptionKey: 'business.mdqaorder.dashboard.quickAction',
      path: '/operations/mdqaorder',
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
