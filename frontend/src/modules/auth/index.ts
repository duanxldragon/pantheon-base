import { defineModule } from '../../core/router/types';

export const AuthModule = defineModule({
  name: 'auth',
  scope: 'system',
  routes: [
    {
      path: 'auth/security',
      routeName: 'auth-security',
      titleKey: 'auth.security.title',
      icon: 'safe',
      componentKey: 'auth/SecurityCenter',
    },
    {
      path: 'system/login-log',
      routeName: 'system-login-log',
      titleKey: 'system.menu.loginLog',
      icon: 'safe',
      pagePermission: 'system:login-log:list',
      componentKey: 'auth/LoginLogList',
    },
    {
      path: 'system/session',
      routeName: 'system-session',
      titleKey: 'system.menu.session',
      icon: 'safe',
      pagePermission: 'system:session:list',
      componentKey: 'auth/SessionList',
    },
  ],
  menus: [
    { path: '/system/login-log', titleKey: 'system.menu.loginLog', icon: 'safe', routeName: 'system-login-log', module: 'system.auth' },
    { path: '/system/session', titleKey: 'system.menu.session', icon: 'safe', routeName: 'system-session', module: 'system.auth' },
  ],
  permissions: [
    'system:login-log:list',
    'system:login-log:export',
    'system:session:list',
    'system:session:delete',
  ],
  i18nNamespaces: ['auth', 'system.menu'],
});
