import { apiRequest } from '../../../api/request';
import { downloadFile } from '../../../api/file';
import { uploadImportFile } from '../../../api/importExport';

export interface DeptNode {
  id: number;
  parentId: number;
  ancestors: string;
  isRoot: boolean;
  deptName: string;
  sort: number;
  leader: string;
  phone: string;
  email: string;
  status: number;
  children?: DeptNode[];
}

export interface DeptListQuery {
  deptName?: string;
  status?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DeptPayload {
  parentId: number;
  deptName: string;
  sort: number;
  leader?: string;
  phone?: string;
  email?: string;
  status: number;
}

export interface DeptBatchStatusPayload {
  deptIds: number[];
  status: number;
}

export function getDeptTree(params?: DeptListQuery) {
  return apiRequest<DeptNode[]>({
    url: '/system/dept/tree',
    method: 'get',
    params,
  });
}

export function createDept(data: DeptPayload) {
  return apiRequest<DeptNode>({
    url: '/system/dept',
    method: 'post',
    data,
  });
}

export function updateDept(id: number, data: DeptPayload) {
  return apiRequest<DeptNode>({
    url: `/system/dept/${id}`,
    method: 'put',
    data,
  });
}

export function deleteDept(id: number) {
  return apiRequest<{ deleted: boolean }>({
    url: `/system/dept/${id}`,
    method: 'delete',
  });
}

export function batchUpdateDeptStatus(data: DeptBatchStatusPayload) {
  return apiRequest<{ updatedCount: number }>({
    url: '/system/dept/batch-status',
    method: 'post',
    data,
  });
}

export function exportDepts(data?: DeptListQuery) {
  return downloadFile({
    url: '/system/dept/export',
    method: 'post',
    data,
    filename: 'system-dept-export.csv',
  });
}

export function downloadDeptImportTemplate() {
  return downloadFile({
    url: '/system/dept/import-template',
    method: 'get',
    filename: 'system-dept-import-template.csv',
  });
}

export function importDepts(file: File) {
  return uploadImportFile('/system/dept/import', file);
}
