import { Modal } from '@arco-design/web-react';
import type { TFunction } from 'i18next';
import { apiRequest } from './request';

export interface ImportErrorItem {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  applied: boolean;
  created: number;
  updated: number;
  failed: number;
  errors: ImportErrorItem[];
}

interface ImportResultOptions {
  errorFileName?: string;
  autoDownloadErrors?: boolean;
}

function translateImportMessage(message: string, t: TFunction) {
  const duplicateMatch = message.match(/^import\.duplicate\.row\.(\d+)$/);
  if (duplicateMatch?.[1]) {
    return t('import.duplicate.row', {
      row: Number(duplicateMatch[1]),
      defaultValue: `Duplicate with row ${duplicateMatch[1]}`,
    });
  }
  return t(message, { defaultValue: message });
}

export function uploadImportFile(url: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<ImportResult>({
    url,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

export function downloadImportErrors(result: ImportResult, t: TFunction, filename = 'import-errors.csv') {
  if (!result.errors.length) {
    return;
  }
  const escapeCSV = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = [
    ['row', 'field', 'messageKey', 'message'],
    ...result.errors.map((item) => [
      item.row,
      item.field,
      item.message,
      translateImportMessage(item.message, t),
    ]),
  ];
  const content = `\uFEFF${rows.map((row) => row.map(escapeCSV).join(',')).join('\n')}`;
  downloadTextFile(filename, content);
}

export function showImportResult(result: ImportResult, t: TFunction, options?: ImportResultOptions) {
  if (result.applied && result.failed === 0) {
    Modal.success({
      title: t('common.import'),
      content: t('common.importSummary', {
        created: result.created,
        updated: result.updated,
        failed: result.failed,
      }),
    });
    return;
  }

  const shouldDownloadErrors = Boolean(options?.autoDownloadErrors && result.errors.length > 0);
  if (shouldDownloadErrors) {
    downloadImportErrors(result, t, options?.errorFileName || 'import-errors.csv');
  }

  const lines = result.errors.slice(0, 8).map((item) => `${t('common.row')} ${item.row} · ${item.field} · ${translateImportMessage(item.message, t)}`);
  const tailLine = shouldDownloadErrors ? [t('common.importErrorFileDownloaded', { filename: options?.errorFileName || 'import-errors.csv' })] : [];
  Modal.error({
    title: t('common.importFailed'),
    content: [t('common.importSummary', {
      created: result.created,
      updated: result.updated,
      failed: result.failed,
    }), ...lines, ...tailLine].join('\n'),
  });
}
