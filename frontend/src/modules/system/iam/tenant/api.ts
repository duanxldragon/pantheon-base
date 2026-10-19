import { apiRequest } from '../../../../api/request';

export type TenantStatus = 'active' | 'suspended' | 'archived' | 'deleted';
export type TenantPlan = 'free' | 'basic' | 'professional' | 'enterprise';
export type TenantMemberRole = 'owner' | 'admin' | 'member';

/** Lifecycle values an operator may set; `deleted` is reserved for the delete action. */
export type TenantEditableStatus = Exclude<TenantStatus, 'deleted'>;

export interface TenantRow {
  id: number;
  code: string;
  name: string;
  status: TenantStatus;
  plan: TenantPlan;
  metadata?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Per-status tenant counts served by the list endpoint. They apply every list
 * filter except `status`, so they stay consistent with the total no matter
 * which page is loaded.
 */
export interface TenantSummary {
  total: number;
  active: number;
  suspended: number;
  archived: number;
  deleted: number;
}

export interface TenantListQuery {
  keyword?: string;
  status?: TenantStatus;
  plan?: TenantPlan;
  page?: number;
  size?: number;
}

export interface TenantListResp {
  items: TenantRow[];
  total: number;
  page: number;
  size: number;
  summary?: TenantSummary;
}

export interface TenantPayload {
  code: string;
  name: string;
  plan?: TenantPlan;
  metadata?: string;
  /**
   * Initial tenant administrator. When `admin_username` is set the backend
   * provisions the tenant in one step: tenant-scoped roles, the admin user,
   * its role binding, the owner membership, the Casbin policies and a copy of
   * the platform settings. Omit it to create the tenant shell and add members
   * later.
   *
   * Wire fields are snake_case to match CreateTenantDTO in tenant_model.go.
   */
  admin_username?: string;
  admin_password?: string;
  admin_nickname?: string;
}

export interface TenantUpdatePayload {
  name?: string;
  status?: TenantEditableStatus;
  plan?: TenantPlan;
  metadata?: string;
}

export interface TenantMemberRow {
  id: number;
  tenant_id: number;
  user_id: number;
  username?: string;
  nickname?: string;
  role: TenantMemberRole;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TenantMemberListResp {
  items: TenantMemberRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TenantMemberPayload {
  user_id: number;
  role: TenantMemberRole;
}

export function getTenantList(params?: TenantListQuery) {
  return apiRequest<TenantListResp>({
    url: '/system/tenant/list',
    method: 'get',
    params,
  });
}

export function getTenant(id: number) {
  return apiRequest<TenantRow>({
    url: `/system/tenant/${id}`,
    method: 'get',
  });
}

export function createTenant(data: TenantPayload) {
  return apiRequest<TenantRow>({
    url: '/system/tenant',
    method: 'post',
    data,
  });
}

export function updateTenant(id: number, data: TenantUpdatePayload) {
  return apiRequest<Record<string, never>>({
    url: `/system/tenant/${id}`,
    method: 'put',
    data,
  });
}

export function deleteTenant(id: number) {
  return apiRequest<Record<string, never>>({
    url: `/system/tenant/${id}`,
    method: 'delete',
  });
}

export function getTenantMembers(id: number, params?: { page?: number; pageSize?: number }) {
  return apiRequest<TenantMemberListResp>({
    url: `/system/tenant/${id}/members`,
    method: 'get',
    params,
  });
}

export function addTenantMember(id: number, data: TenantMemberPayload) {
  return apiRequest<Record<string, never>>({
    url: `/system/tenant/${id}/members`,
    method: 'post',
    data,
  });
}

export function removeTenantMember(id: number, userId: number) {
  return apiRequest<Record<string, never>>({
    url: `/system/tenant/${id}/members/${userId}`,
    method: 'delete',
  });
}
