import { apiRequest } from '../../../api/request';


export interface MdqaorderListRow {
  id: number;
  name: string;
  status: string;
  createdAt: string;
}

export interface MdqaorderDetail {
  id: number;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MdqaorderListQuery {
  name?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MdqaorderListPageResp {
  items: MdqaorderListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MdqaorderCreatePayload {
  name: string;
  status: string;
}

export interface MdqaorderUpdatePayload {
  name?: string;
  status?: string;
}



export function getMdqaorderList(params?: MdqaorderListQuery) {
  return apiRequest<MdqaorderListPageResp>({
    url: '/business/mdqaorder/list',
    method: 'get',
    params,
  });
}

export function getMdqaorderDetail(id: number) {
  return apiRequest<MdqaorderDetail>({
    url: `/business/mdqaorder/${id}`,
    method: 'get',
  });
}



export function createMdqaorder(data: MdqaorderCreatePayload) {
  return apiRequest<MdqaorderListRow>({
    url: '/business/mdqaorder',
    method: 'post',
    data,
  });
}


export function updateMdqaorder(id: number, data: MdqaorderUpdatePayload) {
  return apiRequest<MdqaorderListRow>({
    url: `/business/mdqaorder/${id}`,
    method: 'put',
    data,
  });
}


export function deleteMdqaorder(id: number) {
  return apiRequest<{ deleted: boolean }>({
    url: `/business/mdqaorder/${id}`,
    method: 'delete',
  });
}


