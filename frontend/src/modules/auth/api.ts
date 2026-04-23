import { apiRequest } from '../../api/request';
import { downloadFile } from '../../api/file';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  perms?: string[];
}

export interface AuthTokens {
  token: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  sessionId: string;
}

export interface LoginResp extends AuthTokens {
  user: UserInfo;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface UserPasswordUpdatePayload {
  oldPassword: string;
  newPassword: string;
}

export interface AuthSession {
  sessionId: string;
  isCurrent: boolean;
  lastIp: string;
  browser: string;
  os: string;
  device: string;
  userAgent: string;
  refreshExpiresAt: string;
  lastRefreshAt?: string;
  revokedAt?: string;
  createdAt: string;
}

export interface SecurityOverview {
  user: UserInfo;
  currentSession?: AuthSession;
  activeSessionCount: number;
  lastLoginAt?: string;
}

export interface LoginLogRow {
  id: number;
  username: string;
  ipaddr: string;
  loginLocation: string;
  browser: string;
  os: string;
  status: number;
  msg: string;
  loginTime: string;
}

export interface LoginLogQuery {
  username?: string;
  status?: number;
  page?: number;
  pageSize?: number;
}

export interface LoginLogPageResp {
  items: LoginLogRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminSessionRow {
  sessionId: string;
  userId: number;
  username: string;
  nickname: string;
  lastIp: string;
  browser: string;
  os: string;
  device: string;
  userAgent: string;
  refreshExpiresAt: string;
  lastRefreshAt?: string;
  revokedAt?: string;
  createdAt: string;
}

export interface AdminSessionQuery {
  username?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminSessionPageResp {
  items: AdminSessionRow[];
  total: number;
  page: number;
  pageSize: number;
}

export function login(data: LoginPayload) {
  return apiRequest<LoginResp>({
    url: '/auth/login',
    method: 'post',
    data,
  });
}

export function refreshToken(data: RefreshTokenPayload) {
  return apiRequest<AuthTokens>({
    url: '/auth/refresh',
    method: 'post',
    data,
    skipAuthRefresh: true,
    skipErrorMessage: true,
  });
}

export function logout() {
  return apiRequest<{ loggedOut: boolean }>({
    url: '/auth/logout',
    method: 'post',
    skipAuthRefresh: true,
    skipErrorMessage: true,
  });
}

export function getMe() {
  return apiRequest<UserInfo>({
    url: '/auth/me',
    method: 'get',
  });
}

export function getSecurityOverview() {
  return apiRequest<SecurityOverview>({
    url: '/auth/security',
    method: 'get',
  });
}

export function updatePassword(data: UserPasswordUpdatePayload) {
  return apiRequest<{ passwordUpdated: boolean }>({
    url: '/auth/password',
    method: 'put',
    data,
  });
}

export function getSessions() {
  return apiRequest<AuthSession[]>({
    url: '/auth/sessions',
    method: 'get',
  });
}

export function revokeSession(sessionId: string) {
  return apiRequest<{ revoked: boolean }>({
    url: `/auth/sessions/${sessionId}`,
    method: 'delete',
  });
}

export function getOwnLoginLogs(params?: LoginLogQuery) {
  return apiRequest<LoginLogPageResp>({
    url: '/auth/login-logs',
    method: 'get',
    params,
  });
}

export function getAdminLoginLogList(params?: LoginLogQuery) {
  return apiRequest<LoginLogPageResp>({
    url: '/system/login-log/list',
    method: 'get',
    params,
  });
}

export function getAdminSessionList(params?: AdminSessionQuery) {
  return apiRequest<AdminSessionPageResp>({
    url: '/system/session/list',
    method: 'get',
    params,
  });
}

export function revokeAdminSession(sessionId: string) {
  return apiRequest<{ revoked: boolean }>({
    url: `/system/session/${sessionId}`,
    method: 'delete',
  });
}

export function exportAdminLoginLogs(data?: LoginLogQuery) {
  return downloadFile({
    url: '/system/login-log/export',
    method: 'post',
    data,
    filename: 'system-login-log-export.csv',
  });
}
