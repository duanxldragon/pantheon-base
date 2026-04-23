import { defineModule } from '../../../core/router/types';

export const PostModule = defineModule({
  name: 'post',
  scope: 'system',
  routes: [
    {
      path: 'system/post',
      routeName: 'system-post',
      titleKey: 'system.menu.post',
      icon: 'menu',
      pagePermission: 'system:post:list',
      componentKey: 'system/post/PostList',
    },
  ],
  menus: [
    { path: '/system/post', titleKey: 'system.menu.post', icon: 'storage', routeName: 'system-post', module: 'system.org' },
  ],
  permissions: [
    'system:post:list',
    'system:post:create',
    'system:post:update',
    'system:post:delete',
    'system:post:export',
    'system:post:import',
    'system:post:batch-update',
  ],
  i18nNamespaces: ['system.post', 'system.menu', 'system.permission'],
});
