import { apiRequest } from '../../../api/request';
import { downloadFile } from '../../../api/file';
import { uploadImportFile } from '../../../api/importExport';

export interface CMDBTypeRow {
  id: number;
  typeCode: string;
  typeName: string;
  category: string;
  status: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface CMDBTypeQuery {
  typeCode?: string;
  typeName?: string;
  category?: string;
  status?: number;
  page?: number;
  pageSize?: number;
}

export interface CMDBTypePageResp {
  items: CMDBTypeRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CMDBTypePayload {
  typeCode: string;
  typeName: string;
  category: string;
  status: number;
  remark: string;
}

export interface CMDBItemRow {
  id: number;
  typeId: number;
  typeCode: string;
  typeName: string;
  itemCode: string;
  itemName: string;
  environment: string;
  status: string;
  ownerUserId: number;
  ownerDeptId: number;
  endpoint: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CMDBRelationRow {
  id: number;
  sourceItemId: number;
  sourceItemCode: string;
  sourceItemName: string;
  targetItemId: number;
  targetItemCode: string;
  targetItemName: string;
  relationType: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface CMDBItemDetail extends CMDBItemRow {
  ownerDeptName: string;
  outgoingRelations: CMDBRelationRow[];
  incomingRelations: CMDBRelationRow[];
}

export interface CMDBItemQuery {
  typeId?: number;
  itemCode?: string;
  itemName?: string;
  environment?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CMDBItemPageResp {
  items: CMDBItemRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CMDBItemPayload {
  typeId: number;
  itemCode: string;
  itemName: string;
  environment: string;
  status: string;
  ownerUserId: number;
  ownerDeptId: number;
  endpoint: string;
  description: string;
}

export interface CMDBRelationPayload {
  sourceItemId: number;
  targetItemId: number;
  relationType: string;
  remark: string;
}

export function getCMDBTypeList(params?: CMDBTypeQuery) {
  return apiRequest<CMDBTypePageResp>({
    url: '/business/cmdb/type/list',
    method: 'get',
    params,
  });
}

export function createCMDBType(data: CMDBTypePayload) {
  return apiRequest<CMDBTypeRow>({
    url: '/business/cmdb/type',
    method: 'post',
    data,
  });
}

export function updateCMDBType(id: number, data: CMDBTypePayload) {
  return apiRequest<CMDBTypeRow>({
    url: `/business/cmdb/type/${id}`,
    method: 'put',
    data,
  });
}

export function deleteCMDBType(id: number) {
  return apiRequest<{ deleted: boolean }>({
    url: `/business/cmdb/type/${id}`,
    method: 'delete',
  });
}

export function exportCMDBTypes(data?: CMDBTypeQuery) {
  return downloadFile({
    url: '/business/cmdb/type/export',
    method: 'post',
    data,
    filename: 'cmdb-type-export.csv',
  });
}

export function downloadCMDBTypeImportTemplate() {
  return downloadFile({
    url: '/business/cmdb/type/import-template',
    method: 'get',
    filename: 'cmdb-type-import-template.csv',
  });
}

export function importCMDBTypes(file: File) {
  return uploadImportFile('/business/cmdb/type/import', file);
}

export function getCMDBItemList(params?: CMDBItemQuery) {
  return apiRequest<CMDBItemPageResp>({
    url: '/business/cmdb/item/list',
    method: 'get',
    params,
  });
}

export function getCMDBItemDetail(id: number) {
  return apiRequest<CMDBItemDetail>({
    url: `/business/cmdb/item/${id}`,
    method: 'get',
  });
}

export function createCMDBItem(data: CMDBItemPayload) {
  return apiRequest<CMDBItemRow>({
    url: '/business/cmdb/item',
    method: 'post',
    data,
  });
}

export function updateCMDBItem(id: number, data: CMDBItemPayload) {
  return apiRequest<CMDBItemRow>({
    url: `/business/cmdb/item/${id}`,
    method: 'put',
    data,
  });
}

export function deleteCMDBItem(id: number) {
  return apiRequest<{ deleted: boolean }>({
    url: `/business/cmdb/item/${id}`,
    method: 'delete',
  });
}

export function exportCMDBItems(data?: CMDBItemQuery) {
  return downloadFile({
    url: '/business/cmdb/item/export',
    method: 'post',
    data,
    filename: 'cmdb-item-export.csv',
  });
}

export function downloadCMDBItemImportTemplate() {
  return downloadFile({
    url: '/business/cmdb/item/import-template',
    method: 'get',
    filename: 'cmdb-item-import-template.csv',
  });
}

export function importCMDBItems(file: File) {
  return uploadImportFile('/business/cmdb/item/import', file);
}

export function createCMDBRelation(data: CMDBRelationPayload) {
  return apiRequest<CMDBRelationRow>({
    url: '/business/cmdb/relation',
    method: 'post',
    data,
  });
}

export function deleteCMDBRelation(id: number) {
  return apiRequest<{ deleted: boolean }>({
    url: `/business/cmdb/relation/${id}`,
    method: 'delete',
  });
}

export interface DictOptionItem {
  labelKey: string;
  value: string;
  color: string;
  sort: number;
}

export function getCMDBDictOptions(codes: string[]) {
  return apiRequest<Record<string, DictOptionItem[]>>({
    url: '/system/dict/options',
    method: 'get',
    params: {
      codes: codes.join(','),
    },
  });
}
