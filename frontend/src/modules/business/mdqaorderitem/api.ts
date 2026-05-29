import { apiRequest } from '../../../api/request';


export interface MdqaorderitemListRow {
  id: number;
  itemName: string;
  quantity: number;
  enabled?: boolean;
  orderId: number;
  createdAt: string;
}

export interface MdqaorderitemDetail {
  id: number;
  itemName: string;
  quantity: number;
  enabled?: boolean;
  remark?: string;
  orderId: number;
  createdAt: string;
  updatedAt: string;
}

export interface MdqaorderitemListQuery {
  itemName?: string;
  orderId?: number;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MdqaorderitemListPageResp {
  items: MdqaorderitemListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MdqaorderitemCreatePayload {
  itemName: string;
  quantity: number;
  enabled?: boolean;
  remark?: string;
  orderId: number;
}

export interface MdqaorderitemUpdatePayload {
  itemName?: string;
  quantity?: number;
  enabled?: boolean;
  remark?: string;
  orderId?: number;
}




export function getMdqaorderitemList(params?: MdqaorderitemListQuery) {
  return apiRequest<MdqaorderitemListPageResp>({
    url: '/business/mdqaorderitem/list',
    method: 'get',
    params,
  });
}

export function getMdqaorderitemDetail(id: number) {
  return apiRequest<MdqaorderitemDetail>({
    url: `/business/mdqaorderitem/${id}`,
    method: 'get',
  });
}



export function createMdqaorderitem(data: MdqaorderitemCreatePayload) {
  return apiRequest<MdqaorderitemListRow>({
    url: '/business/mdqaorderitem',
    method: 'post',
    data,
  });
}


export function updateMdqaorderitem(id: number, data: MdqaorderitemUpdatePayload) {
  return apiRequest<MdqaorderitemListRow>({
    url: `/business/mdqaorderitem/${id}`,
    method: 'put',
    data,
  });
}


export function deleteMdqaorderitem(id: number) {
  return apiRequest<{ deleted: boolean }>({
    url: `/business/mdqaorderitem/${id}`,
    method: 'delete',
  });
}
