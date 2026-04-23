import {
  IconApps,
  IconDashboard,
  IconList,
  IconMenu,
  IconSafe,
  IconSettings,
  IconStorage,
  IconUser,
} from '@arco-design/web-react/icon';

export type MenuIconKey = 'dashboard' | 'user' | 'safe' | 'menu' | 'settings' | 'list' | 'apps' | 'storage';

export const MENU_ICON_OPTIONS: Array<{ value: MenuIconKey; labelKey: string }> = [
  { value: 'dashboard', labelKey: 'system.menu.icon.dashboard' },
  { value: 'user', labelKey: 'system.menu.icon.user' },
  { value: 'safe', labelKey: 'system.menu.icon.safe' },
  { value: 'menu', labelKey: 'system.menu.icon.menu' },
  { value: 'settings', labelKey: 'system.menu.icon.settings' },
  { value: 'list', labelKey: 'system.menu.icon.list' },
  { value: 'apps', labelKey: 'system.menu.icon.apps' },
  { value: 'storage', labelKey: 'system.menu.icon.storage' },
];

export function renderMenuIcon(icon?: string) {
  switch ((icon || '').trim().toLowerCase()) {
    case 'dashboard':
      return <IconDashboard />;
    case 'user':
      return <IconUser />;
    case 'safe':
    case 'role':
      return <IconSafe />;
    case 'settings':
      return <IconSettings />;
    case 'list':
      return <IconList />;
    case 'apps':
      return <IconApps />;
    case 'storage':
      return <IconStorage />;
    case 'menu':
    default:
      return <IconMenu />;
  }
}
