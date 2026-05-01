import { apiRequest } from '../../../api/request';
import { downloadFile } from '../../../api/file';
import { uploadImportFile } from '../../../api/importExport';
import type { UserPlatformPreferences } from '../../auth/api';

export interface UserProfile {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  perms?: string[];
  preferences?: UserPlatformPreferences;
  deptId: number;
  postId: number;
  status: number;
  createdAt: string;
}

export interface UserListRow {
  id: number;
  username: string;
  nickname: string;
  email: string;
  phone: string;
  deptId: number;
  deptName: string;
  postId: number;
  postName: string;
  status: number;
  createdAt: string;
  roleIds: number[];
  roleKeys: string[];
}

export interface UserDetail {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email: string;
  phone: string;
  deptId: number;
  deptName: string;
  postId: number;
  postName: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  roleIds: number[];
  roleKeys: string[];
}

export interface UserListQuery {
  username?: string;
  nickname?: string;
  deptId?: number;
  postId?: number;
  status?: number;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserListPageResp {
  items: UserListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserCreatePayload {
  username: string;
  password: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  deptId?: number;
  postId?: number;
  status: number;
  roleIds: number[];
}

export interface UserUpdatePayload {
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  deptId?: number;
  postId?: number;
  status: number;
  roleIds: number[];
}

export interface UserResetPasswordPayload {
  newPassword: string;
}

export interface UserBatchStatusPayload {
  userIds: number[];
  status: number;
}

export interface UserProfileUpdatePayload {
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
}

export function getUserList(params?: UserListQuery) {
  return apiRequest<UserListPageResp>({
    url: '/system/user/list',
    method: 'get',
    params,
  });
}

export function getUserDetail(id: number) {
  return apiRequest<UserDetail>({
    url: `/system/user/${id}`,
    method: 'get',
  });
}

export function getProfile() {
  return apiRequest<UserProfile>({
    url: '/system/profile',
    method: 'get',
  });
}

export function updateProfile(data: UserProfileUpdatePayload) {
  return apiRequest<UserProfile>({
    url: '/system/profile',
    method: 'put',
    data,
  });
}

export function createUser(data: UserCreatePayload) {
  return apiRequest<UserListRow>({
    url: '/system/user',
    method: 'post',
    data,
  });
}

export function updateUser(id: number, data: UserUpdatePayload) {
  return apiRequest<UserListRow>({
    url: `/system/user/${id}`,
    method: 'put',
    data,
  });
}

export function resetUserPassword(id: number, data: UserResetPasswordPayload) {
  return apiRequest<{ passwordReset: boolean; revokedSessionCount: number }>({
    url: `/system/user/${id}/reset-password`,
    method: 'put',
    data,
  });
}

export function batchUpdateUserStatus(data: UserBatchStatusPayload) {
  return apiRequest<{ updatedCount: number }>({
    url: '/system/user/batch-status',
    method: 'post',
    data,
  });
}

export function deleteUser(id: number) {
  return apiRequest<{ deleted: boolean }>({
    url: `/system/user/${id}`,
    method: 'delete',
  });
}

export function exportUsers(data?: UserListQuery) {
  return downloadFile({
    url: '/system/user/export',
    method: 'post',
    data,
    filename: 'system-user-export.csv',
  });
}

export function downloadUserImportTemplate() {
  return downloadFile({
    url: '/system/user/import-template',
    method: 'get',
    filename: 'system-user-import-template.csv',
  });
}

export function importUsers(file: File) {
  return uploadImportFile('/system/user/import', file);
}
