import type { TFunction } from 'i18next';
import type { MenuNode } from '../system/menu/api';
import type { DashboardSummary } from './api';

export type DashboardWidgetSourceDomain =
  | 'platform'
  | 'system/auth'
  | 'system/iam'
  | 'system/org'
  | 'system/config'
  | 'system/audit'
  | `business/${string}`;

export type DashboardWidgetCleanupPolicy =
  | 'platform_owned'
  | 'hide_when_forbidden'
  | 'remove_with_source_module';

type DashboardWidgetSlot = 'quick-action' | 'domain-overview';
type DashboardWidgetNavigationSource = 'menu' | 'direct';

interface DashboardWidgetBase {
  key: string;
  slot: DashboardWidgetSlot;
  sourceDomain: DashboardWidgetSourceDomain;
  titleKey: string;
  descriptionKey: string;
  path: string;
  permission?: string;
  cleanupPolicy: DashboardWidgetCleanupPolicy;
  navigationSource?: DashboardWidgetNavigationSource;
  registrationOwner?: string;
}

export interface DashboardQuickActionWidget extends DashboardWidgetBase {
  slot: 'quick-action';
  icon: string;
}

export interface DashboardDomainOverviewWidget extends DashboardWidgetBase {
  slot: 'domain-overview';
  summary: (summary: DashboardSummary | null, t: TFunction) => string;
}

export type DashboardWidgetDefinition = DashboardQuickActionWidget | DashboardDomainOverviewWidget;

interface DashboardWidgetVisibilityContext {
  menuTree: MenuNode[];
  hasPerm: (permission: string) => boolean;
  isAdmin: boolean;
}

function findMenuNodeByPath(nodes: MenuNode[], path: string): MenuNode | undefined {
  for (const item of nodes) {
    if (item.path === path || item.activeMenu === path) {
      return item;
    }
    if (item.children?.length) {
      const child = findMenuNodeByPath(item.children, path);
      if (child) {
        return child;
      }
    }
  }
  return undefined;
}

function assertDashboardWidgetDefinition(widget: DashboardWidgetDefinition) {
  if (!widget.key.trim()) {
    throw new Error('Dashboard widget key is required.');
  }
  if (!widget.path.startsWith('/')) {
    throw new Error(`Dashboard widget "${widget.key}" must use an absolute route path.`);
  }
  if (widget.sourceDomain.startsWith('business/')) {
    if (!widget.permission) {
      throw new Error(`Business dashboard widget "${widget.key}" must declare a permission.`);
    }
    if (!widget.registrationOwner?.trim()) {
      throw new Error(`Business dashboard widget "${widget.key}" must declare a registration owner.`);
    }
    if (widget.cleanupPolicy !== 'remove_with_source_module') {
      throw new Error(`Business dashboard widget "${widget.key}" must declare remove_with_source_module cleanup.`);
    }
  }
}

function defineDashboardWidgets<T extends DashboardWidgetDefinition[]>(widgets: T): T {
  const keys = new Set<string>();
  widgets.forEach((widget) => {
    assertDashboardWidgetDefinition(widget);
    if (keys.has(widget.key)) {
      throw new Error(`Duplicate dashboard widget key "${widget.key}".`);
    }
    keys.add(widget.key);
  });
  return widgets;
}

export function isDashboardWidgetVisible(widget: DashboardWidgetDefinition, context: DashboardWidgetVisibilityContext) {
  const hasAccess = !widget.permission || context.isAdmin || context.hasPerm(widget.permission);
  if (!hasAccess) {
    return false;
  }
  if (widget.navigationSource === 'direct') {
    return true;
  }
  return Boolean(findMenuNodeByPath(context.menuTree, widget.path));
}

export const dashboardWidgetRegistry = defineDashboardWidgets<DashboardWidgetDefinition[]>([
  {
    key: 'platform.users',
    slot: 'quick-action',
    sourceDomain: 'system/iam',
    titleKey: 'system.menu.user',
    descriptionKey: 'dashboard.quickAction.user',
    path: '/system/user',
    permission: 'system:user:list',
    icon: 'user',
    cleanupPolicy: 'hide_when_forbidden',
  },
  {
    key: 'platform.roles',
    slot: 'quick-action',
    sourceDomain: 'system/iam',
    titleKey: 'system.menu.role',
    descriptionKey: 'dashboard.quickAction.role',
    path: '/system/role',
    permission: 'system:role:list',
    icon: 'safe',
    cleanupPolicy: 'hide_when_forbidden',
  },
  {
    key: 'platform.menus',
    slot: 'quick-action',
    sourceDomain: 'system/iam',
    titleKey: 'system.menu.menu',
    descriptionKey: 'dashboard.quickAction.menu',
    path: '/system/menu',
    permission: 'system:menu:list',
    icon: 'menu',
    cleanupPolicy: 'hide_when_forbidden',
  },
  {
    key: 'platform.dict',
    slot: 'quick-action',
    sourceDomain: 'system/config',
    titleKey: 'system.menu.dict',
    descriptionKey: 'dashboard.quickAction.dict',
    path: '/system/dict',
    permission: 'system:dict:list',
    icon: 'storage',
    cleanupPolicy: 'hide_when_forbidden',
  },
  {
    key: 'platform.setting',
    slot: 'quick-action',
    sourceDomain: 'system/config',
    titleKey: 'system.menu.setting',
    descriptionKey: 'dashboard.quickAction.setting',
    path: '/system/setting',
    permission: 'system:setting:list',
    icon: 'settings',
    cleanupPolicy: 'hide_when_forbidden',
  },
  {
    key: 'platform.security',
    slot: 'quick-action',
    sourceDomain: 'system/auth',
    titleKey: 'auth.security.title',
    descriptionKey: 'dashboard.quickAction.security',
    path: '/auth/security',
    icon: 'safe',
    cleanupPolicy: 'platform_owned',
    navigationSource: 'direct',
  },
  {
    key: 'platform.domain.access',
    slot: 'domain-overview',
    sourceDomain: 'system/iam',
    titleKey: 'dashboard.domain.access',
    descriptionKey: 'dashboard.domain.accessDesc',
    path: '/system/user',
    permission: 'system:user:list',
    cleanupPolicy: 'hide_when_forbidden',
    summary: (summary, t) => t('dashboard.usersAndRoles', {
      users: summary?.totalUsers ?? 0,
      roles: summary?.totalRoles ?? 0,
    }),
  },
  {
    key: 'platform.domain.org',
    slot: 'domain-overview',
    sourceDomain: 'system/org',
    titleKey: 'dashboard.domain.org',
    descriptionKey: 'dashboard.domain.orgDesc',
    path: '/system/dept',
    permission: 'system:dept:list',
    cleanupPolicy: 'hide_when_forbidden',
    summary: (summary, t) => t('dashboard.deptsAndPosts', {
      depts: summary?.totalDepts ?? 0,
      posts: summary?.totalPosts ?? 0,
    }),
  },
  {
    key: 'platform.domain.config',
    slot: 'domain-overview',
    sourceDomain: 'system/config',
    titleKey: 'dashboard.domain.config',
    descriptionKey: 'dashboard.domain.configDesc',
    path: '/system/setting',
    permission: 'system:setting:list',
    cleanupPolicy: 'hide_when_forbidden',
    summary: (summary, t) => t('dashboard.dictAndSettings', {
      dicts: summary?.totalDictTypes ?? 0,
      settings: summary?.totalSettings ?? 0,
    }),
  },
]);

export const dashboardQuickActionWidgets = dashboardWidgetRegistry.filter(
  (widget): widget is DashboardQuickActionWidget => widget.slot === 'quick-action',
);

export const dashboardDomainOverviewWidgets = dashboardWidgetRegistry.filter(
  (widget): widget is DashboardDomainOverviewWidget => widget.slot === 'domain-overview',
);
