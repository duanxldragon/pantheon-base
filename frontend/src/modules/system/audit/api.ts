import { apiRequest } from '../../../api/request';
import { downloadFile } from '../../../api/file';

export interface OperationLogQuery {
  title?: string;
  operName?: string;
  status?: number;
  businessType?: number;
  page: number;
  pageSize: number;
}

export interface OperationLogRow {
  id: number;
  title: string;
  businessType: number;
  method: string;
  operName: string;
  operUrl: string;
  operIp: string;
  operParam: string;
  jsonResult: string;
  status: number;
  errorMsg: string;
  operTime: string;
  costTime: number;
}

export interface OperationLogPageResp {
  items: OperationLogRow[];
  total: number;
  page: number;
  pageSize: number;
}

export function getOperationLogList(params: OperationLogQuery) {
  return apiRequest<OperationLogPageResp>({
    url: '/system/operation-log/list',
    method: 'get',
    params,
  });
}

export function deleteOperationLog(id: number) {
  return apiRequest<{ deleted: boolean }>({
    url: `/system/operation-log/${id}`,
    method: 'delete',
  });
}

export function clearOperationLogs() {
  return apiRequest<{ cleared: boolean }>({
    url: '/system/operation-log/clear',
    method: 'post',
  });
}

export function exportOperationLogs(data: Partial<OperationLogQuery>) {
  return downloadFile({
    url: '/system/operation-log/export',
    method: 'post',
    data,
    filename: 'system-operation-log-export.csv',
  });
}
