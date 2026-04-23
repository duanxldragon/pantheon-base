import { apiRequest } from '../../api/request';

export interface DashboardRecentLogin {
  id: number;
  username: string;
  ipaddr: string;
  browser: string;
  os: string;
  status: number;
  msg: string;
  loginTime: string;
}

export interface DashboardSummary {
  totalUsers: number;
  enabledUsers: number;
  totalRoles: number;
  totalDepts: number;
  totalPosts: number;
  totalDictTypes: number;
  totalSettings: number;
  visibleMenuCount: number;
  activeSessionCount: number;
  loginSuccessCount: number;
  loginFailureCount: number;
  todayOperationCount: number;
  lastSuccessfulLoginAt: string;
  periodDays: number;
  recentLogins: DashboardRecentLogin[];
}

export function getDashboardSummary() {
  return apiRequest<DashboardSummary>({
    url: '/platform/dashboard/summary',
    method: 'get',
    skipErrorMessage: true,
  });
}
