import axios from 'axios';
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { Message } from '@arco-design/web-react';
import i18n from 'i18next';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, useAuthStore } from '../store/useAuthStore';
import { clearShellSessionState } from '../core/shellState';

export interface RequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
  skipErrorMessage?: boolean;
}

export type RequestErrorKind = 'business' | 'unauthorized' | 'forbidden' | 'server' | 'network' | 'timeout' | 'unknown';

export class RequestError extends Error {
  kind: RequestErrorKind;
  code?: number;
  status?: number;
  messageKey?: string;

  constructor(options: { kind: RequestErrorKind; message?: string; code?: number; status?: number; messageKey?: string }) {
    super(options.message || options.messageKey || 'Request Failed');
    this.name = 'RequestError';
    this.kind = options.kind;
    this.code = options.code;
    this.status = options.status;
    this.messageKey = options.messageKey;
  }
}

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

let refreshPromise: Promise<string | null> | null = null;

const readAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
const readRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

const saveTokens = (accessToken: string, refreshTokenValue: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);
};

const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const clearClientSession = () => {
  clearTokens();
  clearShellSessionState();
  useAuthStore.getState().clearAuth();
};

const redirectToLogin = () => {
  clearClientSession();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const shouldRefresh = (config?: RequestConfig, code?: number) => {
  if (!config || config.skipAuthRefresh || config._retry) {
    return false;
  }
  if (config.url?.includes('/system/login') || config.url?.includes('/system/refresh') || config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh')) {
    return false;
  }
  return code === 401;
};

const doRefreshToken = async (): Promise<string | null> => {
  const currentRefreshToken = readRefreshToken();
  if (!currentRefreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/v1/auth/refresh', { refreshToken: currentRefreshToken }, {
        headers: {
          'Accept-Language': localStorage.getItem('pantheon_lang') || 'zh-CN',
        },
      })
      .then((response) => {
        const { code, data } = response.data;
        if (code !== 200) {
          throw new Error(response.data.message || 'Refresh Failed');
        }
        return data;
      })
      .then((data) => {
        saveTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      })
      .catch(() => {
        clearClientSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const createBusinessError = (code?: number, message?: string) => {
  let kind: RequestErrorKind = 'business';
  if (code === 401) {
    kind = 'unauthorized';
  } else if (code === 403) {
    kind = 'forbidden';
  } else if ((code || 0) >= 500) {
    kind = 'server';
  }

  return new RequestError({
    kind,
    code,
    message,
    messageKey: message,
  });
};

const createTransportError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    let kind: RequestErrorKind = 'unknown';

    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      kind = 'timeout';
    } else if (!error.response) {
      kind = 'network';
    } else if (status === 401) {
      kind = 'unauthorized';
    } else if (status === 403) {
      kind = 'forbidden';
    } else if ((status || 0) >= 500) {
      kind = 'server';
    } else {
      kind = 'business';
    }

    const message = error.response?.data?.message || error.message || 'Network Error';
    return new RequestError({
      kind,
      status,
      message,
      messageKey: error.response?.data?.message,
    });
  }

  if (error instanceof RequestError) {
    return error;
  }

  return new RequestError({
    kind: 'unknown',
    message: error instanceof Error ? error.message : 'Request Failed',
  });
};

const translateMessage = (message?: string) => {
  if (!message) {
    return 'Request Failed';
  }
  return i18n.t(message, { defaultValue: message });
};

export const isRequestError = (error: unknown): error is RequestError => error instanceof RequestError;
export const isTimeoutRequestError = (error: unknown) => isRequestError(error) && error.kind === 'timeout';
export const isNetworkRequestError = (error: unknown) => isRequestError(error) && (error.kind === 'network' || error.kind === 'timeout');
export const isServerRequestError = (error: unknown) => isRequestError(error) && error.kind === 'server';

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = readAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept-Language'] = localStorage.getItem('pantheon_lang') || 'zh-CN';
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  async (response) => {
    const config = response.config as RequestConfig;
    const { code, data, message } = response.data;
    if (code === 200) {
      return data;
    }

    if (shouldRefresh(config, code)) {
      const nextToken = await doRefreshToken();
      if (nextToken) {
        config._retry = true;
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${nextToken}`;
        return request(config);
      }
      redirectToLogin();
    }

    const requestError = createBusinessError(code, message || 'Request Failed');
    if (!config.skipErrorMessage) {
      Message.error(translateMessage(requestError.messageKey || requestError.message));
    }
    return Promise.reject(requestError);
  },
  async (error) => {
    const config = error.config as RequestConfig | undefined;
    if (error.response?.status === 401 && shouldRefresh(config, 401)) {
      const nextToken = await doRefreshToken();
      if (nextToken && config) {
        config._retry = true;
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${nextToken}`;
        return request(config);
      }
      redirectToLogin();
    }

    const requestError = createTransportError(error);
    if (!config?.skipErrorMessage) {
      Message.error(translateMessage(requestError.messageKey || requestError.message));
    }
    return Promise.reject(requestError);
  }
);

export default request;

export const apiRequest = request as unknown as <T = unknown>(config: RequestConfig) => Promise<T>;
