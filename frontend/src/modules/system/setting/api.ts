import { apiRequest } from '../../../api/request';

export interface SettingItem {
  id: number;
  settingKey: string;
  settingValue: string;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  groupKey: string;
  module: string;
  isPublic: number;
  isEncrypted: number;
  hasValue: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingGroup {
  groupKey: string;
  items: SettingItem[];
}

export interface PublicSettingResp {
  settings: Record<string, string>;
}

export interface SettingGroupUpdatePayload {
  items: Array<{
    settingKey: string;
    settingValue: string;
  }>;
}

export interface SettingAuditChange {
  settingKey: string;
  oldValue: string;
  newValue: string;
  isEncrypted: number;
}

export interface SettingAuditRow {
  id: number;
  groupKey: string;
  operName: string;
  operIp: string;
  status: number;
  errorMsg: string;
  operTime: string;
  costTime: number;
  changes: SettingAuditChange[];
}

export interface SettingAuditPageResp {
  items: SettingAuditRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SettingAuditQuery {
  groupKey?: string;
  settingKey?: string;
  operName?: string;
  page?: number;
  pageSize?: number;
}

export interface SettingCacheRefreshPayload {
  groupKeys?: string[];
}

export interface SettingCacheRefreshResp {
  refreshedGroups: string[];
  clearedAll: number;
}

export function getSettingList(params?: { groupKey?: string; module?: string }) {
  return apiRequest<SettingItem[]>({
    url: '/system/setting/list',
    method: 'get',
    params,
  });
}

export function getPublicSettingList() {
  return apiRequest<PublicSettingResp>({
    url: '/system/setting/public',
    method: 'get',
    skipAuthRefresh: true,
    skipErrorMessage: true,
  });
}

export function getSettingGroup(groupKey: string) {
  return apiRequest<SettingGroup>({
    url: `/system/setting/group/${groupKey}`,
    method: 'get',
  });
}

export function updateSettingGroup(groupKey: string, data: SettingGroupUpdatePayload) {
  return apiRequest<SettingGroup>({
    url: `/system/setting/group/${groupKey}`,
    method: 'put',
    data,
  });
}

export function getSettingAuditList(params?: SettingAuditQuery) {
  return apiRequest<SettingAuditPageResp>({
    url: '/system/setting/audit/list',
    method: 'get',
    params,
  });
}

export function refreshSettingCache(data: SettingCacheRefreshPayload) {
  return apiRequest<SettingCacheRefreshResp>({
    url: '/system/setting/cache/refresh',
    method: 'post',
    data,
  });
}
