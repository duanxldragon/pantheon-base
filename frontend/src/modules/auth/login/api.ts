import { apiRequest } from '../../../api/request';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface MFAVerifyPayload {
  challengeId: string;
  code: string;
}

export interface LoginResp {
  mfaRequired?: boolean;
  challengeId?: string;
  setupRequired?: boolean;
  totpSecret?: string;
  totpProvisionUri?: string;
  expiresAt?: string;
}

export function login(data: LoginPayload) {
  return apiRequest<LoginResp>({
    url: '/auth/login',
    method: 'post',
    data,
    skipErrorMessage: true,
  });
}

export function verifyMFA(data: MFAVerifyPayload) {
  return apiRequest<LoginResp>({
    url: '/auth/mfa/verify',
    method: 'post',
    data,
    skipErrorMessage: true,
  });
}
