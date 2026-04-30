import { defineModule } from '../../../core/router/types';

export const DictModule = defineModule({
  name: 'dict',
  scope: 'system',
  routes: [
    {
      path: 'system/dict',
      routeName: 'system-dict',
      titleKey: 'system.menu.dict',
      icon: 'book',
      pagePermission: 'system:dict:list',
      componentKey: 'system/dict/DictPage',
    },
  ],
  menus: [
    { path: '/system/dict', titleKey: 'system.menu.dict', icon: 'book', routeName: 'system-dict', module: 'system.config' },
  ],
  permissions: [
    'system:dict:list',
    'system:dict:create',
    'system:dict:update',
    'system:dict:delete',
    'system:dict:refresh',
    'system:dict:export',
    'system:dict:import',
  ],
  i18nNamespaces: ['system.dict', 'system.menu'],
});
