import axios from 'axios';
import { Message } from '@arco-design/web-react';
import i18n from 'i18next';
import { ACCESS_TOKEN_KEY } from '../store/useAuthStore';

interface DownloadFileOptions {
  url: string;
  method?: 'get' | 'post';
  data?: unknown;
  params?: Record<string, unknown>;
  filename?: string;
}

function readAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function parseFilename(contentDisposition?: string, fallbackName?: string) {
  if (!contentDisposition) {
    return fallbackName || 'download.csv';
  }
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }
  const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }
  return fallbackName || 'download.csv';
}

function saveBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

export async function downloadFile(options: DownloadFileOptions) {
  const response = await axios.request<Blob>({
    baseURL: '/api/v1',
    url: options.url,
    method: options.method || 'get',
    data: options.data,
    params: options.params,
    responseType: 'blob',
    timeout: 30000,
    headers: {
      Authorization: readAccessToken() ? `Bearer ${readAccessToken()}` : '',
      'Accept-Language': localStorage.getItem('pantheon_lang') || 'zh-CN',
    },
    validateStatus: () => true,
  });

  const contentType = String(response.headers['content-type'] || '');
  if (response.status >= 400 || contentType.includes('application/json')) {
    try {
      const text = await response.data.text();
      const payload = JSON.parse(text);
      const messageKey = payload?.message || 'request.failed';
      Message.error(i18n.t(messageKey, { defaultValue: messageKey }));
      throw new Error(messageKey);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('request.failed');
    }
  }

  const filename = parseFilename(String(response.headers['content-disposition'] || ''), options.filename);
  saveBlob(response.data, filename);
}
