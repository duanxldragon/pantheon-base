import { defineModule } from '../../../core/router/types';

export const MdqaorderitemModule = defineModule({
  name: 'mdqaorderitem',
  scope: 'business',
  routes: [
    {
      path: 'operations/mdqaorderitem',
      routeName: 'business-mdqaorderitem',
      titleKey: 'business.mdqaorderitem.title',
      icon: 'apps',
      pagePermission: 'business:mdqaorderitem:list',
      componentKey: 'business/mdqaorderitem/MdqaorderitemList',
    },
    {
      path: 'operations/mdqaorderitem/:id',
      routeName: 'business-mdqaorderitem-detail',
      titleKey: 'business.mdqaorderitem.title',
      pagePermission: 'business:mdqaorderitem:view',
      activeMenu: '/operations/mdqaorderitem',
      componentKey: 'business/mdqaorderitem/MdqaorderitemDetail',
    },
  ],
  menus: [
    { path: '/operations/mdqaorderitem', titleKey: 'business.mdqaorderitem.title', icon: 'apps', routeName: 'business-mdqaorderitem', module: 'business.mdqaorderitem' },
  ],
  dashboardWidgets: [
    {
      key: 'business:mdqaorderitem',
      slot: 'quick-action',
      sourceDomain: 'business/mdqaorderitem',
      titleKey: 'business.mdqaorderitem.title',
      descriptionKey: 'business.mdqaorderitem.dashboard.quickAction',
      path: '/operations/mdqaorderitem',
      permission: 'business:mdqaorderitem:list',
      icon: 'apps',
      cleanupPolicy: 'remove_with_source_module',
      registrationOwner: 'business.mdqaorderitem',
    },
  ],
  permissions: [
    'business:mdqaorderitem:list',
    'business:mdqaorderitem:view',
    'business:mdqaorderitem:create',
    'business:mdqaorderitem:update',
    'business:mdqaorderitem:delete'
  ],
  i18nNamespaces: ['business.mdqaorderitem'],
});
