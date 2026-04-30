import { apiRequest } from '../../../../api/request';
import { downloadFile } from '../../../../api/file';
import { uploadImportFile } from '../../../../api/importExport';


export interface CmdbHostListRow {
  id: number;
  hostCode: string;
  hostname: string;
  displayName: string;
  ipAddress: string;
  sshPort: number;
  osFamily: string;
  osName: string;
  kernelVersion: string;
  arch: string;
  environment: string;
  status: string;
  lifecycleStatus: string;
  provider: string;
  regionCode: string;
  idcCode: string;
  clusterName: string;
  ownerUserId: number;
  ownerName: string;
  maintainerTeam: string;
  purpose: string;
  lastCheckInAt?: string;
  lastInventoryAt?: string;
  lastOperatedAt?: string;
  remark: string;
  createdAt: string;
}

export interface CmdbHostListQuery {
  hostCode?: string;
  hostname?: string;
  displayName?: string;
  osName?: string;
  status?: string;
  lifecycleStatus?: string;
  regionCode?: string;
  idcCode?: string;
  clusterName?: string;
  ownerName?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CmdbHostListPageResp {
  items: CmdbHostListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CmdbHostCreatePayload {
  hostCode: string;
  hostname: string;
  displayName: string;
  ipAddress: string;
  sshPort: number;
  osFamily: string;
  osName: string;
  kernelVersion: string;
  arch: string;
  environment: string;
  status: string;
  lifecycleStatus: string;
  provider: string;
  regionCode: string;
  idcCode: string;
  clusterName: string;
  ownerUserId: number;
  ownerName: string;
  maintainerTeam: string;
  purpose: string;
  lastCheckInAt?: string;
  lastInventoryAt?: string;
  lastOperatedAt?: string;
  remark: string;
}

export interface CmdbHostUpdatePayload {
  hostCode?: string;
  hostname?: string;
  displayName?: string;
  ipAddress?: string;
  sshPort?: number;
  osFamily?: string;
  osName?: string;
  kernelVersion?: string;
  arch?: string;
  environment?: string;
  status?: string;
  lifecycleStatus?: string;
  provider?: string;
  regionCode?: string;
  idcCode?: string;
  clusterName?: string;
  ownerUserId?: number;
  ownerName?: string;
  maintainerTeam?: string;
  purpose?: string;
  lastCheckInAt?: string;
  lastInventoryAt?: string;
  lastOperatedAt?: string;
  remark?: string;
}

export function getCmdbHostList(params?: CmdbHostListQuery) {
  return apiRequest<CmdbHostListPageResp>({
    url: '/business/cmdb/host/list',
    method: 'get',
    params,
  });
}



export function createCmdbHost(data: CmdbHostCreatePayload) {
  return apiRequest<CmdbHostListRow>({
    url: '/business/cmdb/host',
    method: 'post',
    data,
  });
}


export function updateCmdbHost(id: number, data: CmdbHostUpdatePayload) {
  return apiRequest<CmdbHostListRow>({
    url: `/business/cmdb/host/${id}`,
    method: 'put',
    data,
  });
}


export function deleteCmdbHost(id: number) {
  return apiRequest<{ deleted: boolean }>({
    url: `/business/cmdb/host/${id}`,
    method: 'delete',
  });
}



export function exportCmdbHosts(data?: CmdbHostListQuery) {
  return downloadFile({
    url: '/business/cmdb/host/export',
    method: 'post',
    data,
    filename: 'business-cmdb-host-export.csv',
  });
}


export function importCmdbHosts(file: File) {
  return uploadImportFile('/business/cmdb/host/import', file);
}

