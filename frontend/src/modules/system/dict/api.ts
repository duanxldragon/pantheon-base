import { apiRequest } from '../../../api/request';
import { downloadFile } from '../../../api/file';
import { uploadImportFile } from '../../../api/importExport';

export interface DictTypeRow {
  id: number;
  dictCode: string;
  dictName: string;
  module: string;
  status: number;
  remark: string;
  createdAt: string;
}

export interface DictTypeQuery {
  dictCode?: string;
  dictName?: string;
  status?: number;
}

export interface DictTypePayload {
  dictCode: string;
  dictName: string;
  module: string;
  status: number;
  remark: string;
}

export interface DictItemRow {
  id: number;
  dictCode: string;
  itemLabelKey: string;
  itemValue: string;
  itemColor: string;
  sort: number;
  status: number;
  remark: string;
  createdAt: string;
}

export interface DictItemQuery {
  dictCode: string;
  status?: number;
}

export interface DictItemPayload {
  dictCode: string;
  itemLabelKey: string;
  itemValue: string;
  itemColor: string;
  sort: number;
  status: number;
  remark: string;
}

export interface DictCacheRefreshPayload {
  codes?: string[];
}

export interface DictCacheRefreshResp {
  refreshedCodes: string[];
  clearedAll: number;
}

export function getDictTypeList(params?: DictTypeQuery) {
  return apiRequest<DictTypeRow[]>({
    url: '/system/dict/type/list',
    method: 'get',
    params,
  });
}

export function createDictType(data: DictTypePayload) {
  return apiRequest<DictTypeRow>({
    url: '/system/dict/type',
    method: 'post',
    data,
  });
}

export function updateDictType(id: number, data: DictTypePayload) {
  return apiRequest<DictTypeRow>({
    url: `/system/dict/type/${id}`,
    method: 'put',
    data,
  });
}

export function deleteDictType(id: number) {
  return apiRequest<{ deleted: boolean }>({
    url: `/system/dict/type/${id}`,
    method: 'delete',
  });
}

export function getDictItemList(params: DictItemQuery) {
  return apiRequest<DictItemRow[]>({
    url: '/system/dict/item/list',
    method: 'get',
    params,
  });
}

export function createDictItem(data: DictItemPayload) {
  return apiRequest<DictItemRow>({
    url: '/system/dict/item',
    method: 'post',
    data,
  });
}

export function updateDictItem(id: number, data: DictItemPayload) {
  return apiRequest<DictItemRow>({
    url: `/system/dict/item/${id}`,
    method: 'put',
    data,
  });
}

export function deleteDictItem(id: number) {
  return apiRequest<{ deleted: boolean }>({
    url: `/system/dict/item/${id}`,
    method: 'delete',
  });
}

export function refreshDictCache(data: DictCacheRefreshPayload) {
  return apiRequest<DictCacheRefreshResp>({
    url: '/system/dict/cache/refresh',
    method: 'post',
    data,
  });
}

export function exportDictTypes(data?: DictTypeQuery) {
  return downloadFile({
    url: '/system/dict/type/export',
    method: 'post',
    data,
    filename: 'system-dict-type-export.csv',
  });
}

export function downloadDictTypeImportTemplate() {
  return downloadFile({
    url: '/system/dict/type/import-template',
    method: 'get',
    filename: 'system-dict-type-import-template.csv',
  });
}

export function importDictTypes(file: File) {
  return uploadImportFile('/system/dict/type/import', file);
}

export function exportDictItems(data: DictItemQuery) {
  return downloadFile({
    url: '/system/dict/item/export',
    method: 'post',
    data,
    filename: 'system-dict-item-export.csv',
  });
}

export function downloadDictItemImportTemplate() {
  return downloadFile({
    url: '/system/dict/item/import-template',
    method: 'get',
    filename: 'system-dict-item-import-template.csv',
  });
}

export function importDictItems(file: File) {
  return uploadImportFile('/system/dict/item/import', file);
}
