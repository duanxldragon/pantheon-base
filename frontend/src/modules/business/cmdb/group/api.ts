import { apiRequest } from '../../../../api/request';

export interface ConditionRule {
  key: string;
  op: 'eq' | 'neq' | 'in' | 'notIn';
  val: string;
}

export interface ConditionExpression {
  operator: 'AND' | 'OR';
  rules: ConditionRule[];
}

export interface GroupRow {
  id: number;
  name: string;
  description: string;
  conditions: ConditionExpression;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  conditions: ConditionExpression;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  conditions?: ConditionExpression;
}

export interface GroupMemberResp {
  groupId: number;
  groupName: string;
  members: Record<string, any>[];
}

export function getGroupList() {
  return apiRequest<GroupRow[]>({
    url: '/business/cmdb/groups',
    method: 'get',
  });
}

export function getGroupDetail(id: number) {
  return apiRequest<GroupRow>({
    url: `/business/cmdb/groups/${id}`,
    method: 'get',
  });
}

export function getGroupMembers(id: number) {
  return apiRequest<GroupMemberResp>({
    url: `/business/cmdb/groups/${id}/members`,
    method: 'get',
  });
}

export function createGroup(data: CreateGroupPayload) {
  return apiRequest<GroupRow>({
    url: '/business/cmdb/groups',
    method: 'post',
    data,
  });
}

export function updateGroup(id: number, data: UpdateGroupPayload) {
  return apiRequest<GroupRow>({
    url: `/business/cmdb/groups/${id}`,
    method: 'put',
    data,
  });
}

export function deleteGroup(id: number) {
  return apiRequest<void>({
    url: `/business/cmdb/groups/${id}`,
    method: 'delete',
  });
}
