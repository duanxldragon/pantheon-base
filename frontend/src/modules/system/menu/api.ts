import { apiRequest } from '../../../api/request';

export interface MenuNode {
  id: number;
  parentId: number;
  titleKey: string;
  path: string;
  component: string;
  pagePerm: string;
  perms: string;
  type: string;
  icon: string;
  routeName: string;
  module: string;
  sort: number;
  isVisible: number;
  isCache: number;
  isExternal: number;
  activeMenu: string;
  children?: MenuNode[];
}

export interface MenuPayload {
  parentId: number;
  titleKey: string;
  path: string;
  component: string;
  pagePerm: string;
  perms: string;
  type: string;
  icon: string;
  routeName: string;
  module: string;
  sort: number;
  isVisible: number;
  isCache: number;
  isExternal: number;
  activeMenu: string;
}

export interface MenuListQuery {
  titleKey?: string;
  path?: string;
  isVisible?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  scope?: 'nav' | 'manage';
}

export function getMenuTree(params?: MenuListQuery) {
  return apiRequest<MenuNode[]>({
    url: '/system/menu/tree',
    method: 'get',
    params,
  });
}

export function createMenu(data: MenuPayload) {
  return apiRequest<MenuNode>({
    url: '/system/menu',
    method: 'post',
    data,
  });
}

export function updateMenu(id: number, data: MenuPayload) {
  return apiRequest<MenuNode>({
    url: `/system/menu/${id}`,
    method: 'put',
    data,
  });
}

export function deleteMenu(id: number) {
  return apiRequest<{ deleted: boolean }>({
    url: `/system/menu/${id}`,
    method: 'delete',
  });
}
