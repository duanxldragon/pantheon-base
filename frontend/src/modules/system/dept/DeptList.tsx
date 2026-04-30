import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Grid,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
  TreeSelect,
} from '@arco-design/web-react';
import { message } from '../../../components/feedback/message';
import { IconDelete, IconDownload, IconEdit, IconEye, IconPlus, IconSearch } from '@arco-design/web-react/icon';
import type { ColumnProps, SorterInfo, TableProps } from '@arco-design/web-react/es/Table/interface';
import type { TreeSelectDataType } from '@arco-design/web-react/es/TreeSelect/interface';
import { useTranslation } from 'react-i18next';
import { showImportResult } from '../../../api/importExport';
import { isNetworkRequestError, isServerRequestError, isTimeoutRequestError } from '../../../api/request';
import { isArcoFormValidationError } from '../../../core/arco/formValidation';
import { publishRefresh, useRefreshSubscription } from '../../../core/refresh/refreshBus';
import { invalidateRouteWarmDataMany, resolveRouteWarmData } from '../../../core/router/prefetch';
import { usePermission } from '../../../hooks/usePermission';
import { batchUpdateDeptLeader, batchUpdateDeptStatus, createDept, deleteDept, downloadDeptImportTemplate, exportDepts, exportDeptGovernanceTasks, getDeptGovernanceTasks, getDeptLeaderCandidates, getDeptOverview, getDeptTree, importDepts, updateDept, type DeptGovernanceTask, type DeptGovernanceTaskQuery, type DeptLeaderCandidate, type DeptListQuery, type DeptNode, type DeptOverviewResp, type DeptPayload } from './api';
import { createPost, getPostList, type PostPayload, type PostRow } from '../post/api';
import { getUserDetail, getUserList, type UserDetail as UserDetailData, type UserListRow } from '../user/api';
import UserDetailContent from '../user/UserDetailContent';
import { AppModal, AppTable, FilterPanel, FormSection, ImportCsvButton, ListHeaderActions, PageActions, PageContainer, PageEmpty, PageError, PageHeader, PageLoading, PageNetworkError, PageServerError, SubmitBar, TableBatchActionBar, PermissionAction, TABLE_ACTION_COLUMN_WIDTH } from '../../../components';
import '../list-page.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

interface DeptFormValues {
  parentId: string;
  deptName: string;
  sort: number;
  leaderUserId?: number;
  leader?: string;
  phone?: string;
  email?: string;
  status: number;
}

interface DeptLeaderFormValues {
  [deptId: string]: number | undefined;
}

type OrgPostFormValues = PostPayload;

interface BatchLeaderTask {
  deptId: number;
  deptName: string;
  candidates: DeptLeaderCandidate[];
}

const emptyQuery: DeptListQuery = {
  deptName: '',
  status: undefined,
  governance: undefined,
  sortField: 'sort',
  sortOrder: 'asc',
};

const emptyForm: DeptFormValues = {
  parentId: '0',
  deptName: '',
  sort: 0,
  leaderUserId: undefined,
  leader: '',
  phone: '',
  email: '',
  status: 1,
};

const orgChartPageSize = 1000;

function isDefaultDeptListQuery(query: DeptListQuery) {
  return !query.deptName
    && query.status === undefined
    && query.governance === undefined
    && (query.sortField || 'sort') === 'sort'
    && (query.sortOrder || 'asc') === 'asc';
}

function findRootDept(nodes: DeptNode[]): DeptNode | undefined {
  return nodes.find((node) => node.isRoot || node.parentId === 0);
}

function flattenDeptNodes(nodes: DeptNode[]): DeptNode[] {
  return nodes.flatMap((node) => [node, ...flattenDeptNodes(node.children || [])]);
}

function groupByDept<T extends { deptId: number }>(items: T[]) {
  return items.reduce<Map<number, T[]>>((result, item) => {
    const current = result.get(item.deptId) || [];
    current.push(item);
    result.set(item.deptId, current);
    return result;
  }, new Map<number, T[]>());
}

function groupUsersByPost(users: UserListRow[]) {
  return users.reduce<Map<number, UserListRow[]>>((result, user) => {
    if (!user.postId) {
      return result;
    }
    const current = result.get(user.postId) || [];
    current.push(user);
    result.set(user.postId, current);
    return result;
  }, new Map<number, UserListRow[]>());
}

function collectDeptIDs(node: DeptNode): number[] {
  return [node.id, ...(node.children || []).flatMap((child) => collectDeptIDs(child))];
}

function findDeptNode(nodes: DeptNode[], deptID: number): DeptNode | undefined {
  for (const node of nodes) {
    if (node.id === deptID) {
      return node;
    }
    const found = findDeptNode(node.children || [], deptID);
    if (found) {
      return found;
    }
  }
  return undefined;
}

interface LoadDataOptions {
  silent?: boolean;
}

interface OrgDeptNodeProps {
  dept: DeptNode;
  postsByDept: Map<number, PostRow[]>;
  usersByDept: Map<number, UserListRow[]>;
  usersByPost: Map<number, UserListRow[]>;
  selectedDeptId: number;
  onSelect: (deptID: number) => void;
}

const OrgDeptNode: React.FC<OrgDeptNodeProps> = ({
  dept,
  postsByDept,
  usersByDept,
  usersByPost,
  selectedDeptId,
  onSelect,
}) => {
  const { t } = useTranslation();
  const posts = postsByDept.get(dept.id) || [];
  const deptUsers = usersByDept.get(dept.id) || [];
  const postIDs = new Set(posts.map((post) => post.id));
  const unassignedUsers = deptUsers.filter((user) => !user.postId || !postIDs.has(user.postId));
  const enabledPosts = posts.filter((post) => post.status === 1).length;

  const selectDept = () => onSelect(dept.id);
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectDept();
    }
  };

  return (
    <div className="org-chart__branch">
      <div
        className={`org-chart__dept-card${selectedDeptId === dept.id ? ' org-chart__dept-card--active' : ''}`}
        role="button"
        tabIndex={0}
        onClick={selectDept}
        onKeyDown={handleKeyDown}
      >
        <div className="org-chart__dept-header">
          <div className="org-chart__dept-title">
            <span>{dept.deptName}</span>
            {dept.isRoot ? <Tag color="arcoblue">{t('system.dept.root')}</Tag> : null}
          </div>
          <Tag color={dept.status === 1 ? 'green' : 'red'}>
            {dept.status === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}
          </Tag>
        </div>
        <div className="org-chart__dept-meta">
          <span>{t('system.dept.leader')}: {dept.leader || '-'}</span>
          <span>{t('system.dept.orgChildren')}: {dept.children?.length || 0}</span>
        </div>
        <div className="org-chart__metric-row">
          <span>{t('system.dept.orgPostCount', { count: posts.length })}</span>
          <span>{t('system.dept.orgEnabledPostCount', { count: enabledPosts })}</span>
          <span>{t('system.dept.orgMemberCount', { count: deptUsers.length })}</span>
        </div>
        <div className="org-chart__posts">
          {posts.length > 0 ? posts.map((post) => {
            const members = usersByPost.get(post.id) || [];
            const visibleMembers = members.slice(0, 4);
            return (
              <div className="org-chart__post" key={post.id}>
                <div className="org-chart__post-head">
                  <span>{post.postName}</span>
                  <Tag size="small" color={post.status === 1 ? 'green' : 'red'}>
                    {post.status === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}
                  </Tag>
                </div>
                <div className="org-chart__post-code">{post.postCode}</div>
                <div className="org-chart__member-row">
                  {visibleMembers.length > 0 ? visibleMembers.map((member) => (
                    <Tag key={member.id} size="small" color="arcoblue">{member.nickname || member.username}</Tag>
                  )) : <span>{t('system.dept.orgNoMembers')}</span>}
                  {members.length > visibleMembers.length ? <Tag size="small">+{members.length - visibleMembers.length}</Tag> : null}
                </div>
              </div>
            );
          }) : (
            <div className="org-chart__empty-line">{t('system.dept.orgNoPosts')}</div>
          )}
          {unassignedUsers.length > 0 ? (
            <div className="org-chart__post org-chart__post--unassigned">
              <div className="org-chart__post-head">
                <span>{t('system.dept.orgUnassignedPost')}</span>
              </div>
              <div className="org-chart__member-row">
                {unassignedUsers.slice(0, 6).map((member) => (
                  <Tag key={member.id} size="small">{member.nickname || member.username}</Tag>
                ))}
                {unassignedUsers.length > 6 ? <Tag size="small">+{unassignedUsers.length - 6}</Tag> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {dept.children?.length ? (
        <div className="org-chart__children">
          {dept.children.map((child) => (
            <OrgDeptNode
              key={child.id}
              dept={child}
              postsByDept={postsByDept}
              usersByDept={usersByDept}
              usersByPost={usersByPost}
              selectedDeptId={selectedDeptId}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const DeptList: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, hasPerm } = usePermission();
  const canCreate = isAdmin || hasPerm('system:dept:create');
  const canEdit = isAdmin || hasPerm('system:dept:update');
  const canDelete = isAdmin || hasPerm('system:dept:delete');
  const canExport = isAdmin || hasPerm('system:dept:export');
  const canImport = isAdmin || hasPerm('system:dept:import');
  const canBatchUpdate = isAdmin || hasPerm('system:dept:batch-update');
  const canViewPosts = isAdmin || hasPerm('system:post:list');
  const canViewUsers = isAdmin || hasPerm('system:user:list');
  const canCreatePost = isAdmin || hasPerm('system:post:create');
  const canViewUserDetail = isAdmin || hasPerm('system:user:view');
  const [activeTab, setActiveTab] = useState('manage');
  const [data, setData] = useState<DeptNode[]>([]);
  const [allDeptTree, setAllDeptTree] = useState<DeptNode[]>([]);
  const [orgDepts, setOrgDepts] = useState<DeptNode[]>([]);
  const [orgPosts, setOrgPosts] = useState<PostRow[]>([]);
  const [orgUsers, setOrgUsers] = useState<UserListRow[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState<unknown>(null);
  const [selectedOrgDeptId, setSelectedOrgDeptId] = useState(0);
  const [postVisible, setPostVisible] = useState(false);
  const [creatingPostDept, setCreatingPostDept] = useState<DeptNode | null>(null);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [userDetailVisible, setUserDetailVisible] = useState(false);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetailError, setUserDetailError] = useState(false);
  const [userDetail, setUserDetail] = useState<UserDetailData | null>(null);
  const [userDetailId, setUserDetailId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<DeptNode | null>(null);
  const [leaderVisible, setLeaderVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);
  const [overview, setOverview] = useState<DeptOverviewResp | null>(null);
  const [governanceTasks, setGovernanceTasks] = useState<DeptGovernanceTask[]>([]);
  const [governanceLoading, setGovernanceLoading] = useState(false);
  const [leaderCandidates, setLeaderCandidates] = useState<DeptLeaderCandidate[]>([]);
  const [leaderCandidateLoading, setLeaderCandidateLoading] = useState(false);
  const [batchLeaderTasks, setBatchLeaderTasks] = useState<BatchLeaderTask[]>([]);
  const [query, setQuery] = useState<DeptListQuery>(emptyQuery);
  const [form] = Form.useForm<DeptFormValues>();
  const [leaderForm] = Form.useForm<DeptLeaderFormValues>();
  const [postForm] = Form.useForm<OrgPostFormValues>();
  const [queryForm] = Form.useForm<DeptListQuery>();
  const invalidateDeptCaches = useCallback(() => {
    invalidateRouteWarmDataMany([
      { path: '/system/dept', resourceKeys: ['tree:default', 'overview', 'tree:sorted', 'posts:org-chart', 'users:org-chart'] },
      { path: '/system/user', resourceKeys: ['depts:default'] },
      { path: '/system/post', resourceKeys: ['depts:sorted'] },
    ]);
  }, []);

  const buildGovernanceTaskQuery = useCallback((nextQuery: DeptListQuery): DeptGovernanceTaskQuery => ({
    keyword: nextQuery.deptName || undefined,
    governance: nextQuery.governance as DeptGovernanceTaskQuery['governance'],
    scope: 'all',
  }), []);

  const loadData = useCallback(async (nextQuery: DeptListQuery = query, options?: LoadDataOptions) => {
    const silent = options?.silent === true;
    if (!silent) {
      setLoading(true);
      setError(null);
      setGovernanceLoading(true);
    }
    try {
      const [rows, overviewResp, taskRows] = await Promise.all([
        isDefaultDeptListQuery(nextQuery)
          ? resolveRouteWarmData('/system/dept', 'tree:default', () => getDeptTree(nextQuery))
          : getDeptTree(nextQuery),
        resolveRouteWarmData('/system/dept', 'overview', () => getDeptOverview()),
        getDeptGovernanceTasks(buildGovernanceTaskQuery(nextQuery)),
      ]);
      setData(rows);
      setOverview(overviewResp);
      setGovernanceTasks(taskRows);
    } catch (requestError) {
      setError(requestError);
      setGovernanceTasks([]);
    } finally {
      if (!silent) {
        setLoading(false);
        setGovernanceLoading(false);
      }
    }
  }, [buildGovernanceTaskQuery, query]);

  const loadAllDepts = useCallback(async () => {
    try {
      const rows = await resolveRouteWarmData('/system/dept', 'tree:sorted', () => getDeptTree({ sortField: 'sort', sortOrder: 'asc' }));
      setAllDeptTree(rows);
    } catch {
      message.error(t('common.loadFailed'));
    }
  }, [t]);

  const loadOrgData = useCallback(async (options?: LoadDataOptions) => {
    const silent = options?.silent === true;
    if (!silent) {
      setOrgLoading(true);
      setOrgError(null);
    }
    try {
      const [deptRows, postRows, userRows] = await Promise.all([
        resolveRouteWarmData('/system/dept', 'tree:sorted', () => getDeptTree({ sortField: 'sort', sortOrder: 'asc' })),
        canViewPosts
          ? resolveRouteWarmData('/system/dept', 'posts:org-chart', () => getPostList({ page: 1, pageSize: orgChartPageSize, sortField: 'sort', sortOrder: 'asc' }))
          : Promise.resolve({ items: [], total: 0, page: 1, pageSize: orgChartPageSize }),
        canViewUsers
          ? resolveRouteWarmData('/system/dept', 'users:org-chart', () => getUserList({ page: 1, pageSize: orgChartPageSize, sortField: 'username', sortOrder: 'asc' }))
          : Promise.resolve({ items: [], total: 0, page: 1, pageSize: orgChartPageSize }),
      ]);
      setOrgDepts(deptRows);
      setOrgPosts(postRows.items);
      setOrgUsers(userRows.items);
      setSelectedOrgDeptId((current) => {
        if (current && findDeptNode(deptRows, current)) {
          return current;
        }
        return findRootDept(deptRows)?.id || flattenDeptNodes(deptRows)[0]?.id || 0;
      });
    } catch (requestError) {
      setOrgError(requestError);
    } finally {
      if (!silent) {
        setOrgLoading(false);
      }
    }
  }, [canViewPosts, canViewUsers]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(query), 0);
    return () => window.clearTimeout(timer);
  }, [loadData, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAllDepts(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAllDepts]);

  useEffect(() => {
    if (activeTab !== 'org') {
      return undefined;
    }
    const timer = window.setTimeout(() => void loadOrgData(), 0);
    return () => window.clearTimeout(timer);
  }, [activeTab, loadOrgData]);

  useRefreshSubscription(['system:dept:changed', 'system:post:changed', 'system:user:changed'], (payload) => {
    if (payload.source === 'system/dept') {
      return;
    }
    void loadData(query);
    void loadAllDepts();
    if (activeTab === 'org') {
      void loadOrgData();
    }
  });

  useEffect(() => {
    const state = (window.history.state && typeof window.history.state === 'object'
      ? (window.history.state.usr as { deptId?: number; taskKey?: string } | null)
      : null);
    if (!state?.deptId) {
      return;
    }
    setSelectedOrgDeptId(state.deptId);
    setActiveTab('org');
  }, []);

  const deptOptions = useMemo<TreeSelectDataType[]>(() => {
    const build = (nodes: DeptNode[]): TreeSelectDataType[] => nodes.map((node) => ({
      title: node.deptName,
      key: String(node.id),
      value: String(node.id),
      children: node.children?.length ? build(node.children) : undefined,
    }));
    return build(allDeptTree);
  }, [allDeptTree]);

  const flatOrgDepts = useMemo(() => flattenDeptNodes(orgDepts), [orgDepts]);
  const flatDeptRows = useMemo(() => flattenDeptNodes(data), [data]);
  const postsByDept = useMemo(() => groupByDept(orgPosts), [orgPosts]);
  const usersByDept = useMemo(() => groupByDept(orgUsers), [orgUsers]);
  const usersByPost = useMemo(() => groupUsersByPost(orgUsers), [orgUsers]);
  const selectedOrgDept = useMemo(
    () => findDeptNode(orgDepts, selectedOrgDeptId),
    [orgDepts, selectedOrgDeptId],
  );
  const selectedOrgStats = useMemo(() => {
    if (!selectedOrgDept) {
      return { deptCount: 0, postCount: 0, userCount: 0 };
    }
    const deptIDs = new Set(collectDeptIDs(selectedOrgDept));
    return {
      deptCount: deptIDs.size,
      postCount: orgPosts.filter((post) => deptIDs.has(post.deptId)).length,
      userCount: orgUsers.filter((user) => deptIDs.has(user.deptId)).length,
    };
  }, [orgPosts, orgUsers, selectedOrgDept]);
  const heroStats = useMemo(() => {
    if (!overview) {
      return [];
    }
    return [
      {
        key: 'totalDepts',
        label: t('system.dept.overview.totalDepts'),
        value: overview.totalDeptCount,
        hint: t('system.dept.hero.totalDeptsHint'),
      },
      {
        key: 'totalPosts',
        label: t('system.dept.overview.totalPosts'),
        value: overview.totalPostCount,
        hint: t('system.dept.hero.totalPostsHint'),
      },
      {
        key: 'leaderless',
        label: t('system.dept.overview.leaderlessDepts'),
        value: overview.leaderlessDeptCount,
        hint: t('system.dept.hero.leaderlessHint'),
      },
      {
        key: 'noPost',
        label: t('system.dept.overview.noPostDepts'),
        value: overview.noPostDeptCount,
        hint: t('system.dept.hero.noPostHint'),
      },
      {
        key: 'empty',
        label: t('system.dept.overview.emptyDepts'),
        value: overview.emptyDeptCount,
        hint: t('system.dept.hero.emptyHint'),
      },
      {
        key: 'issues',
        label: t('system.dept.overview.healthIssues'),
        value: overview.healthIssueCount,
        hint: t('system.dept.hero.issuesHint'),
      },
    ];
  }, [overview, t]);

  const openCreate = () => {
    const rootDept = findRootDept(allDeptTree);
    setEditing(null);
    setLeaderCandidates([]);
    form.setFieldsValue({
      ...emptyForm,
      parentId: rootDept ? String(rootDept.id) : emptyForm.parentId,
    });
    setVisible(true);
  };

  const loadLeaderCandidateOptions = useCallback(async (deptId: number) => {
    setLeaderCandidateLoading(true);
    try {
      const items = await getDeptLeaderCandidates(deptId);
      setLeaderCandidates(items);
      return items;
    } catch {
      message.error(t('system.dept.leaderCandidateLoadFailed'));
      setLeaderCandidates([]);
      return [];
    } finally {
      setLeaderCandidateLoading(false);
    }
  }, [t]);

  const openEdit = async (row: DeptNode) => {
    setEditing(row);
    setLeaderCandidates([]);
    let matchedLeaderUserId: number | undefined = row.leaderUserId || undefined;
    const items = row.isRoot ? [] : await loadLeaderCandidateOptions(row.id);
    if (!matchedLeaderUserId && row.leader) {
      const matched = items.find((item) => item.displayName === row.leader || item.nickname === row.leader || item.username === row.leader);
      matchedLeaderUserId = matched?.userId;
    }
    form.setFieldsValue({
      parentId: row.isRoot ? String(row.id) : String(row.parentId),
      deptName: row.deptName,
      sort: row.sort,
      leaderUserId: matchedLeaderUserId,
      leader: row.leader,
      phone: row.phone,
      email: row.email,
      status: row.status,
    });
    setVisible(true);
  };

  const submitForm = async () => {
    let values;
    try {
      values = await form.validate();
    } catch (error) {
      if (isArcoFormValidationError(error)) {
        return;
      }
      throw error;
    }
    const payload: DeptPayload = {
      ...values,
      parentId: editing?.isRoot ? 0 : Number(values.parentId || 0),
      leaderUserId: values.leaderUserId ? Number(values.leaderUserId) : 0,
    };
    setSubmitting(true);
    try {
      if (editing) {
        await updateDept(editing.id, payload);
        message.success(t('common.updateSuccess'));
      } else {
        await createDept(payload);
        message.success(t('common.createSuccess'));
      }
      invalidateDeptCaches();
      publishRefresh('system:dept:changed', 'system/dept');
      setVisible(false);
      await loadData(query, { silent: true });
      await loadAllDepts();
      if (activeTab === 'org') {
        await loadOrgData({ silent: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaderCandidateChange = (value: string | number | undefined) => {
    const numericValue = Number(value || 0);
    if (!numericValue) {
      return;
    }
    const matched = leaderCandidates.find((item) => item.userId === numericValue);
    if (matched) {
      form.setFieldValue('leader', matched.displayName);
    }
  };

  const removeDept = async (id: number) => {
    await deleteDept(id);
    message.success(t('common.deleteSuccess'));
    invalidateDeptCaches();
    publishRefresh('system:dept:changed', 'system/dept');
    setSelectedRowKeys((keys) => keys.filter((key) => Number(key) !== id));
    await loadData(query, { silent: true });
    await loadAllDepts();
    if (activeTab === 'org') {
      await loadOrgData({ silent: true });
    }
  };

  const search = () => {
    const values = queryForm.getFieldsValue();
    setSelectedRowKeys([]);
    setQuery({
      ...query,
      ...values,
    });
  };

  const applyGovernanceFilter = (governance?: 'leaderless' | 'no-post' | 'empty') => {
    const nextQuery: DeptListQuery = {
      ...query,
      governance,
    };
    queryForm.setFieldsValue({
      ...queryForm.getFieldsValue(),
      governance,
    });
    setSelectedRowKeys([]);
    setQuery(nextQuery);
  };

  const reset = () => {
    queryForm.setFieldsValue(emptyQuery);
    setSelectedRowKeys([]);
    setQuery(emptyQuery);
  };

  const toArcoSortOrder = (sortOrder?: DeptListQuery['sortOrder']) => {
    if (sortOrder === 'asc') {
      return 'ascend';
    }
    if (sortOrder === 'desc') {
      return 'descend';
    }
    return undefined;
  };

  const sortableColumn = (field: NonNullable<DeptListQuery['sortField']>): Partial<ColumnProps<DeptNode>> => ({
    sorter: true,
    sortOrder: query.sortField === field ? toArcoSortOrder(query.sortOrder) : undefined,
  });

  const handleTableChange: TableProps<DeptNode>['onChange'] = (_pagination, sorter) => {
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter as SorterInfo | undefined;
    setSelectedRowKeys([]);
    setQuery({
      ...query,
      sortField: currentSorter?.direction ? String(currentSorter.field) : emptyQuery.sortField,
      sortOrder: currentSorter?.direction === 'descend' ? 'desc' : 'asc',
    });
  };

  const columns: ColumnProps<DeptNode>[] = [
    {
      title: t('system.dept.deptName'),
      dataIndex: 'deptName',
      width: 220,
      ...sortableColumn('deptName'),
      render: (_: unknown, row: DeptNode) => (
        <Space size={8}>
          <span>{row.deptName}</span>
          {row.isRoot ? <Tag color="arcoblue">{t('system.dept.root')}</Tag> : null}
        </Space>
      ),
    },
    { title: t('system.dept.leader'), dataIndex: 'leader', width: 140, ...sortableColumn('leader') },
    { title: t('system.dept.phone'), dataIndex: 'phone', width: 140 },
    { title: t('system.dept.email'), dataIndex: 'email', width: 180 },
    { title: t('system.dept.sort'), dataIndex: 'sort', width: 120, ...sortableColumn('sort') },
    {
      title: t('system.dept.governance'),
      width: 220,
      render: (_: unknown, row: DeptNode) => {
        if (row.isRoot) {
          return <Tag>{t('system.dept.root')}</Tag>;
        }
        const tags = [];
        if (row.isLeaderless) {
          tags.push(<Tag key="leaderless" color="orange">{t('system.dept.governance.leaderless')}</Tag>);
        }
        if (row.isNoPost) {
          tags.push(<Tag key="no-post" color="gold">{t('system.dept.governance.noPost')}</Tag>);
        }
        if (row.isEmpty) {
          tags.push(<Tag key="empty" color="red">{t('system.dept.governance.empty')}</Tag>);
        }
        if (tags.length === 0) {
          tags.push(<Tag key="clean" color="green">{t('system.dept.governance.clean')}</Tag>);
        }
        return <Space size={4} wrap>{tags}</Space>;
      },
    },
    {
      title: t('system.dept.status'),
      dataIndex: 'status',
      width: 120,
      ...sortableColumn('status'),
      render: (value: number) => (
        <Tag color={value === 1 ? 'green' : 'red'}>
          {value === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}
        </Tag>
      ),
    },
    {
      title: t('common.action'),
      width: TABLE_ACTION_COLUMN_WIDTH.medium,
      fixed: 'right',
      render: (_: unknown, row: DeptNode) => (
        <Space size={4} className="system-list__actions">
          {canCreatePost && !row.isRoot && row.isNoPost ? (
            <Button type="text" size="small" icon={<IconPlus />} onClick={() => openCreatePostForDept(row)}>
              {t('system.dept.action.createPost')}
            </Button>
          ) : null}
          {canEdit ? (
            <Button type="text" size="small" icon={<IconEdit />} onClick={() => { void openEdit(row); }}>
              {t('common.edit')}
            </Button>
          ) : null}
          {canDelete ? (
            <Popconfirm title={t('system.dept.deleteConfirm')} onOk={() => removeDept(row.id)} disabled={row.isRoot}>
              <Button type="text" size="small" status="danger" icon={<IconDelete />} disabled={row.isRoot}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  const renderErrorState = () => {
    if (isNetworkRequestError(error)) {
      return <PageNetworkError timeout={isTimeoutRequestError(error)} onRetry={() => { void loadData(query); }} />;
    }
    if (isServerRequestError(error)) {
      return <PageServerError onRetry={() => { void loadData(query); }} />;
    }
    return <PageError onRetry={() => { void loadData(query); }} />;
  };

  const handleExport = async () => {
    await exportDepts(query);
  };

  const handleExportGovernanceTasks = async () => {
    await exportDeptGovernanceTasks(buildGovernanceTaskQuery(query));
  };

  const handleDownloadTemplate = async () => {
    await downloadDeptImportTemplate();
  };

  const handleImport = async (file: File) => {
    const result = await importDepts(file);
    showImportResult(result, t);
    if (result.applied) {
      invalidateDeptCaches();
      publishRefresh('system:dept:changed', 'system/dept');
      await loadData(query, { silent: true });
      await loadAllDepts();
      if (activeTab === 'org') {
        await loadOrgData({ silent: true });
      }
    }
  };

  const handleBatchStatus = async (status: 1 | 2) => {
    if (selectedRowKeys.length === 0) {
      message.warning(t('common.batchSelectionRequired'));
      return;
    }
    const deptIds = selectedRowKeys.map((item) => Number(item)).filter((item) => item > 0);
    const result = await batchUpdateDeptStatus({ deptIds, status });
    message.success(t('system.dept.batchStatusSuccess', { count: result.updatedCount }));
    invalidateDeptCaches();
    publishRefresh('system:dept:changed', 'system/dept');
    setSelectedRowKeys([]);
    await loadData(query, { silent: true });
    await loadAllDepts();
    if (activeTab === 'org') {
      await loadOrgData({ silent: true });
    }
  };

  const locateGovernanceTask = async (task: DeptGovernanceTask) => {
    const deptRow = flatDeptRows.find((item) => item.id === task.deptId);
    if (task.governanceScope === 'dept' && deptRow) {
      if (task.governanceAction === 'assign-leader' && canEdit) {
        await openEdit(deptRow);
        return;
      }
      if (task.governanceAction === 'create-post' && canCreatePost) {
        openCreatePostForDept(deptRow);
        return;
      }
      if (task.governanceTag === 'leaderless' || task.governanceTag === 'no-post' || task.governanceTag === 'empty') {
        applyGovernanceFilter(task.governanceTag as 'leaderless' | 'no-post' | 'empty');
        return;
      }
    }
    setActiveTab('org');
    setSelectedOrgDeptId(task.deptId);
  };

  const openBatchLeader = () => {
    const selectedDeptIds = selectedRowKeys.map((item) => Number(item)).filter((item) => item > 0);
    const selectedDepts = flatDeptRows.filter((item) => selectedDeptIds.includes(item.id) && !item.isRoot);
    if (selectedDepts.length === 0) {
      message.warning(t('common.batchSelectionRequired'));
      return;
    }
    setLeaderVisible(true);
    setLeaderCandidateLoading(true);
    void Promise.all(selectedDepts.map(async (dept) => ({
      deptId: dept.id,
      deptName: dept.deptName,
      candidates: await getDeptLeaderCandidates(dept.id),
    }))).then((tasks) => {
      setBatchLeaderTasks(tasks);
      const initialValues: DeptLeaderFormValues = {};
      tasks.forEach((task) => {
        if (task.candidates.length === 1) {
          initialValues[String(task.deptId)] = task.candidates[0].userId;
        }
      });
      leaderForm.setFieldsValue(initialValues);
    }).catch(() => {
      message.error(t('system.dept.leaderCandidateLoadFailed'));
      setLeaderVisible(false);
      setBatchLeaderTasks([]);
    }).finally(() => {
      setLeaderCandidateLoading(false);
    });
  };

  const submitBatchLeader = async () => {
    let values;
    try {
      values = await leaderForm.validate();
    } catch (error) {
      if (isArcoFormValidationError(error)) {
        return;
      }
      throw error;
    }
    const items = batchLeaderTasks.map((task) => ({
      deptId: task.deptId,
      leaderUserId: Number(values[String(task.deptId)] || 0),
    }));
    if (items.some((item) => item.leaderUserId <= 0)) {
      message.warning(t('system.dept.batchLeaderRequired'));
      return;
    }
    const result = await batchUpdateDeptLeader({ items });
    message.success(t('system.dept.batchLeaderSuccess', { count: result.updatedCount }));
    invalidateDeptCaches();
    publishRefresh('system:dept:changed', 'system/dept');
    setLeaderVisible(false);
    setBatchLeaderTasks([]);
    leaderForm.resetFields();
    setSelectedRowKeys([]);
    await loadData(query, { silent: true });
    await loadAllDepts();
    if (activeTab === 'org') {
      await loadOrgData({ silent: true });
    }
  };

  const batchActionDisabled = !canBatchUpdate || selectedRowKeys.length === 0;
  const batchLeaderDisabled = !canEdit || selectedRowKeys.length === 0;

  const governanceTaskColumns: ColumnProps<DeptGovernanceTask>[] = [
    { title: t('system.dept.task.scope'), dataIndex: 'governanceScopeLabel', width: 110 },
    { title: t('system.dept.task.tag'), dataIndex: 'governanceTagLabel', width: 180 },
    {
      title: t('system.dept.task.resource'),
      width: 220,
      render: (_: unknown, row: DeptGovernanceTask) => row.governanceScope === 'post'
        ? `${row.postName || '-'} / ${row.deptName || '-'}`
        : row.deptName,
    },
    { title: t('system.dept.task.blockedBy'), dataIndex: 'governanceBlockedByLabel', width: 170 },
    { title: t('system.dept.task.action'), dataIndex: 'governanceActionLabel', width: 220 },
    { title: t('system.dept.task.deptPath'), dataIndex: 'deptPath', width: 240 },
    {
      title: t('system.dept.task.relatedUserCount'),
      dataIndex: 'relatedUserCount',
      width: 110,
    },
    {
      title: t('common.action'),
      width: TABLE_ACTION_COLUMN_WIDTH.compact,
      render: (_: unknown, row: DeptGovernanceTask) => (
        <Button type="text" size="small" icon={<IconEye />} onClick={() => { void locateGovernanceTask(row); }}>
          {t('system.dept.task.locate')}
        </Button>
      ),
    },
  ];

  const openCreatePostForDept = (dept: DeptNode | null) => {
    if (!dept || dept.isRoot) {
      return;
    }
    setCreatingPostDept(dept);
    postForm.setFieldsValue({
      deptId: dept.id,
      postCode: '',
      postName: '',
      sort: 0,
      status: 1,
      remark: '',
    });
    setPostVisible(true);
  };

  const openCreatePost = () => {
    openCreatePostForDept(selectedOrgDept || null);
  };

  const submitPostForm = async () => {
    let values;
    try {
      values = await postForm.validate();
    } catch (error) {
      if (isArcoFormValidationError(error)) {
        return;
      }
      throw error;
    }
    setPostSubmitting(true);
    try {
      await createPost(values);
      message.success(t('common.createSuccess'));
      invalidateDeptCaches();
      invalidateRouteWarmDataMany([
        { path: '/system/post', resourceKeys: ['list:default'] },
        { path: '/system/user', resourceKeys: ['posts:active'] },
      ]);
      publishRefresh(['system:dept:changed', 'system:post:changed'], 'system/dept');
      setPostVisible(false);
      setCreatingPostDept(null);
      await loadData(query, { silent: true });
      await loadAllDepts();
      await loadOrgData({ silent: true });
    } finally {
      setPostSubmitting(false);
    }
  };

  const openUserDetail = async (userId: number) => {
    if (!canViewUserDetail) {
      return;
    }
    setUserDetailId(userId);
    setUserDetailVisible(true);
    setUserDetailLoading(true);
    setUserDetailError(false);
    setUserDetail(null);
    try {
      const result = await getUserDetail(userId);
      setUserDetail(result);
    } catch {
      setUserDetailError(true);
    } finally {
      setUserDetailLoading(false);
    }
  };

  const renderOrgErrorState = () => {
    if (isNetworkRequestError(orgError)) {
      return <PageNetworkError timeout={isTimeoutRequestError(orgError)} onRetry={() => { void loadOrgData(); }} />;
    }
    if (isServerRequestError(orgError)) {
      return <PageServerError onRetry={() => { void loadOrgData(); }} />;
    }
    return <PageError onRetry={() => { void loadOrgData(); }} />;
  };

  const renderOrgView = () => {
    const selectedPosts = selectedOrgDept ? postsByDept.get(selectedOrgDept.id) || [] : [];
    const selectedUsers = selectedOrgDept ? usersByDept.get(selectedOrgDept.id) || [] : [];

    if (orgLoading && orgDepts.length === 0) {
      return <PageLoading />;
    }
    if (orgError && orgDepts.length === 0) {
      return renderOrgErrorState();
    }
    if (!orgLoading && !orgError && orgDepts.length === 0) {
      return <PageEmpty description={t('system.dept.orgNoDept')} />;
    }

    return (
      <Space direction="vertical" size={16} className="org-structure">
        <div className="org-structure__summary">
          <Card className="org-structure__summary-card">
            <span>{t('system.dept.orgDeptTotal')}</span>
            <strong>{flatOrgDepts.length}</strong>
          </Card>
          <Card className="org-structure__summary-card">
            <span>{t('system.dept.orgPostTotal')}</span>
            <strong>{orgPosts.length}</strong>
          </Card>
          <Card className="org-structure__summary-card">
            <span>{t('system.dept.orgMemberTotal')}</span>
            <strong>{orgUsers.length}</strong>
          </Card>
          <Card className="org-structure__summary-card org-structure__summary-card--active">
            <span>{t('system.dept.orgSelectedScope')}</span>
            <strong>{selectedOrgStats.deptCount}/{selectedOrgStats.postCount}/{selectedOrgStats.userCount}</strong>
          </Card>
        </div>
        {(!canViewPosts || !canViewUsers) ? (
          <Card className="org-structure__notice">
            {!canViewPosts ? <span>{t('system.dept.orgPostPermissionHint')}</span> : null}
            {!canViewUsers ? <span>{t('system.dept.orgUserPermissionHint')}</span> : null}
          </Card>
        ) : null}
        <div className="org-structure__body">
          <Card className="page-panel org-structure__chart-card">
            <div className="org-structure__section-head">
              <div>
                <div className="org-structure__section-title">{t('system.dept.orgChartTitle')}</div>
                <div className="org-structure__section-desc">{t('system.dept.orgChartHint')}</div>
              </div>
              <Button size="small" onClick={() => { void loadOrgData(); }} loading={orgLoading}>{t('common.refresh')}</Button>
            </div>
            <div className="org-chart">
              {orgDepts.map((dept) => (
                <OrgDeptNode
                  key={dept.id}
                  dept={dept}
                  postsByDept={postsByDept}
                  usersByDept={usersByDept}
                  usersByPost={usersByPost}
                  selectedDeptId={selectedOrgDeptId}
                  onSelect={setSelectedOrgDeptId}
                />
              ))}
            </div>
          </Card>
          <Card className="page-panel org-structure__detail-card">
            <div className="org-structure__section-head">
              <div>
                <div className="org-structure__section-title">{selectedOrgDept?.deptName || t('system.dept.orgNoSelection')}</div>
                <div className="org-structure__section-desc">{t('system.dept.orgDetailHint')}</div>
              </div>
              <Button
                size="small"
                type="primary"
                icon={<IconPlus />}
                disabled={!canCreatePost || !selectedOrgDept || selectedOrgDept.isRoot}
                onClick={openCreatePost}
              >
                {t('system.dept.orgAddPost')}
              </Button>
            </div>
            {selectedOrgDept ? (
              <Space direction="vertical" size={14} className="org-structure__detail">
                <div className="org-structure__detail-grid">
                  <div><span>{t('system.dept.leader')}</span><strong>{selectedOrgDept.leader || '-'}</strong></div>
                  <div><span>{t('system.dept.phone')}</span><strong>{selectedOrgDept.phone || '-'}</strong></div>
                  <div><span>{t('system.dept.orgChildren')}</span><strong>{selectedOrgDept.children?.length || 0}</strong></div>
                  <div><span>{t('system.dept.status')}</span><strong>{selectedOrgDept.status === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}</strong></div>
                </div>
                <div>
                  <div className="org-structure__sub-title-row">
                    <div className="org-structure__sub-title">{t('system.dept.orgDirectPosts')}</div>
                    {selectedOrgDept.isRoot ? <span>{t('system.dept.orgRootPostHint')}</span> : null}
                  </div>
                  <div className="org-structure__tag-list">
                    {selectedPosts.length > 0 ? selectedPosts.map((post) => (
                      <Tag key={post.id} color={post.status === 1 ? 'arcoblue' : 'gray'}>
                        {post.postName}
                      </Tag>
                    )) : <span>{t('system.dept.orgNoPosts')}</span>}
                  </div>
                </div>
                <div>
                  <div className="org-structure__sub-title">{t('system.dept.orgDirectMembers')}</div>
                  <div className="org-structure__member-list">
                    {selectedUsers.length > 0 ? selectedUsers.map((user) => (
                      <div className="org-structure__member-item" key={user.id}>
                        <div>
                          <strong>{user.nickname || user.username}</strong>
                          <span>{user.username} · {user.postName || t('system.post.none')}</span>
                        </div>
                        <Button
                          size="mini"
                          type="text"
                          icon={<IconEye />}
                          disabled={!canViewUserDetail}
                          onClick={() => { void openUserDetail(user.id); }}
                        >
                          {t('common.detail')}
                        </Button>
                      </div>
                    )) : <span>{t('system.dept.orgNoMembers')}</span>}
                  </div>
                </div>
                <div className="org-structure__rule">{t('system.dept.orgRelationRule')}</div>
              </Space>
            ) : <PageEmpty description={t('system.dept.orgNoSelection')} />}
          </Card>
        </div>
      </Space>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        extra={activeTab === 'manage' ? (
          <ListHeaderActions
            utility={(
              <>
                <Button icon={<IconDownload />} onClick={() => { void handleExport(); }} disabled={!canExport}>{t('common.export')}</Button>
                <Button onClick={() => { void handleDownloadTemplate(); }} disabled={!canImport}>{t('common.downloadTemplate')}</Button>
                <ImportCsvButton disabled={!canImport} onSelect={(file) => { void handleImport(file); }}>
                  {t('common.import')}
                </ImportCsvButton>
              </>
            )}
            primary={<Button type="primary" icon={<IconPlus />} onClick={openCreate} disabled={!canCreate}>{t('common.add')}</Button>}
          />
        ) : (
          <PageActions>
            <Button onClick={() => { void loadOrgData(); }} loading={orgLoading}>{t('common.refresh')}</Button>
          </PageActions>
        )}
      />
      <Space direction="vertical" size={16} className="system-page-template governance-workbench">
        {overview ? (
          <Card className="page-panel system-page-hero">
            <div className="system-page-hero__top">
              <div className="system-page-hero__copy">
                <span className="system-page-hero__eyebrow">{t('system.dept.hero.eyebrow')}</span>
                <Typography.Paragraph className="system-page-hero__desc">
                  {t('system.dept.hero.desc')}
                </Typography.Paragraph>
              </div>
            </div>
            <div className="system-page-kpi-grid">
              {heroStats.map((item) => (
                <div
                  key={item.key}
                  className="system-page-kpi"
                  role={item.key === 'leaderless' || item.key === 'noPost' || item.key === 'empty' || item.key === 'issues' ? 'button' : undefined}
                  tabIndex={item.key === 'leaderless' || item.key === 'noPost' || item.key === 'empty' || item.key === 'issues' ? 0 : undefined}
                  onClick={
                    item.key === 'leaderless'
                      ? () => applyGovernanceFilter('leaderless')
                      : item.key === 'noPost'
                        ? () => applyGovernanceFilter('no-post')
                        : item.key === 'empty'
                          ? () => applyGovernanceFilter('empty')
                          : item.key === 'issues'
                            ? () => applyGovernanceFilter(undefined)
                            : undefined
                  }
                  onKeyDown={
                    item.key === 'leaderless' || item.key === 'noPost' || item.key === 'empty' || item.key === 'issues'
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            if (item.key === 'leaderless') {
                              applyGovernanceFilter('leaderless');
                            } else if (item.key === 'noPost') {
                              applyGovernanceFilter('no-post');
                            } else if (item.key === 'empty') {
                              applyGovernanceFilter('empty');
                            } else {
                              applyGovernanceFilter(undefined);
                            }
                          }
                        }
                      : undefined
                  }
                >
                  <span className="system-page-kpi__label">{item.label}</span>
                  <span className="system-page-kpi__value">{item.value}</span>
                  <span className="system-page-kpi__hint">{item.hint}</span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
        <Tabs activeTab={activeTab} onChange={setActiveTab} className="system-dept-tabs">
          <Tabs.TabPane key="manage" title={t('system.dept.manageTab')}>
            <div className="page-split-layout">
              <div className="page-main-column">
                <Card
                  className="page-panel system-list__table-card"
                  title={t('system.dept.task.title')}
                  extra={(
                    <Space>
                      <Button size="small" onClick={() => { void loadData(query); }} loading={governanceLoading}>{t('common.refresh')}</Button>
                      <Button size="small" icon={<IconDownload />} onClick={() => { void handleExportGovernanceTasks(); }} disabled={!canExport}>
                        {t('system.dept.task.export')}
                      </Button>
                    </Space>
                  )}
                >
                  <Typography.Text className="governance-workbench__task-desc">
                    {t('system.dept.task.hint')}
                  </Typography.Text>
                  <AppTable<DeptGovernanceTask>
                    className="system-list__table"
                    data={governanceTasks}
                    columns={governanceTaskColumns}
                    rowKey="taskKey"
                    loading={governanceLoading}
                    scroll={{ x: 1440 }}
                    emptyText={t('common.noData')}
                    pagination={false}
                  />
                </Card>
                <FilterPanel>
                  <Form form={queryForm} layout="vertical">
                    <Row gutter={16}>
                      <Col xs={24} md={12} lg={8}>
                        <FormItem label={t('system.dept.deptName')} field="deptName">
                          <Input />
                        </FormItem>
                      </Col>
                      <Col xs={24} md={12} lg={8}>
                        <FormItem label={t('system.dept.status')} field="status">
                          <Select allowClear options={[
                            { label: t('system.user.status.enabled'), value: 1 },
                            { label: t('system.user.status.disabled'), value: 2 },
                          ]} />
                        </FormItem>
                      </Col>
                      <Col xs={24} md={12} lg={8}>
                        <FormItem label={t('system.dept.governance')} field="governance">
                          <Select
                            allowClear
                            options={[
                              { label: t('system.dept.governance.leaderless'), value: 'leaderless' },
                              { label: t('system.dept.governance.noPost'), value: 'no-post' },
                              { label: t('system.dept.governance.empty'), value: 'empty' },
                            ]}
                          />
                        </FormItem>
                      </Col>
                      <Col xs={24} md={24} lg={8}>
                        <FormItem className="filter-panel__action-item">
                          <Space>
                            <Button type="primary" icon={<IconSearch />} onClick={search}>{t('common.search')}</Button>
                            <Button onClick={reset}>{t('common.reset')}</Button>
                          </Space>
                        </FormItem>
                      </Col>
                    </Row>
                  </Form>
                </FilterPanel>
                <Card className="page-panel system-list__table-card">
                  <TableBatchActionBar
                    selectedCount={selectedRowKeys.length}
                    selectedText={t('common.selectedCount', { count: selectedRowKeys.length })}
                    clearText={t('common.clearSelection')}
                    clearSuccessText={t('common.clearSelectionSuccess')}
                    onClear={() => setSelectedRowKeys([])}
                    hint={!canBatchUpdate || !canEdit ? t('common.batchActionPermissionHint') : undefined}
                    actions={(
                      <>
                        <PermissionAction allowed={canBatchUpdate} tooltip={t('common.noPermissionAction')}>
                          <Popconfirm title={t('system.dept.batchEnableConfirm')} onOk={() => { void handleBatchStatus(1); }} disabled={batchActionDisabled}>
                            <Button disabled={batchActionDisabled}>{t('system.dept.batchEnable')}</Button>
                          </Popconfirm>
                        </PermissionAction>
                        <PermissionAction allowed={canBatchUpdate} tooltip={t('common.noPermissionAction')}>
                          <Popconfirm title={t('system.dept.batchDisableConfirm')} onOk={() => { void handleBatchStatus(2); }} disabled={batchActionDisabled}>
                            <Button status={batchActionDisabled ? undefined : 'warning'} disabled={batchActionDisabled}>{t('system.dept.batchDisable')}</Button>
                          </Popconfirm>
                        </PermissionAction>
                        <PermissionAction allowed={canEdit} tooltip={t('common.noPermissionAction')}>
                          <Button onClick={openBatchLeader} disabled={batchLeaderDisabled}>{t('system.dept.batchLeader')}</Button>
                        </PermissionAction>
                      </>
                    )}
                  />
                  {loading && data.length === 0 ? <PageLoading /> : null}
                  {error && data.length === 0 ? renderErrorState() : null}
                  {!loading && !error && data.length === 0 ? <PageEmpty description={t('common.noData')} /> : null}
                  {!loading && !(error && data.length === 0) && data.length > 0 ? (
                    <AppTable<DeptNode>
                      className="system-list__table"
                      data={data}
                      columns={columns}
                      rowKey="id"
                      loading={loading}
                      scroll={{ x: 1480 }}
                      rowSelection={{
                        type: 'checkbox',
                        selectedRowKeys,
                        fixed: true,
                        checkboxProps: (row) => ({ disabled: row.isRoot }),
                        onChange: (rowKeys) => setSelectedRowKeys(rowKeys),
                      }}
                      onChange={handleTableChange}
                      emptyText={t('common.noData')}
                    />
                  ) : null}
                </Card>
              </div>
              <div className="page-side-column">
                {overview ? (
                  <Card className="page-panel side-rail-panel governance-workbench__summary">
                    <span className="side-rail-panel__title">{t('system.dept.governance')}</span>
                    <div className="side-rail-stack">
                      <div className="side-rail-item">
                        <span className="side-rail-item__label">{t('system.dept.overview.healthIssues')}</span>
                        <span className="side-rail-item__value">{overview.healthIssueCount}</span>
                        <span className="side-rail-item__desc">{t('system.dept.task.hint')}</span>
                      </div>
                      <div className="side-rail-item">
                        <span className="side-rail-item__label">{t('system.dept.overview.leaderlessDepts')}</span>
                        <span className="side-rail-item__value">{overview.leaderlessDeptCount}</span>
                        <span className="side-rail-item__desc">{t('system.dept.leaderCandidateHint')}</span>
                      </div>
                      <div className="side-rail-item">
                        <span className="side-rail-item__label">{t('system.dept.overview.noPostDepts')}</span>
                        <span className="side-rail-item__value">{overview.noPostDeptCount}</span>
                        <span className="side-rail-item__desc">{t('system.dept.governanceHint')}</span>
                      </div>
                    </div>
                  </Card>
                ) : null}
                <Card className="page-panel side-rail-panel">
                  <span className="side-rail-panel__title">{t('system.dept.task.title')}</span>
                  <div className="side-rail-note">
                    <span className="side-rail-note__title">{t('system.dept.governance')}</span>
                    <span className="side-rail-note__desc">
                      {t('system.dept.governanceHint')}
                    </span>
                  </div>
                </Card>
              </div>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane key="org" title={t('system.dept.orgTab')}>
            {renderOrgView()}
          </Tabs.TabPane>
        </Tabs>
      </Space>

      <AppModal
        title={editing ? t('system.dept.edit') : t('system.dept.create')}
        visible={visible}
        size="lg"
        onCancel={() => setVisible(false)}
        footer={(
          <SubmitBar
            onCancel={() => setVisible(false)}
            onSubmit={() => { void submitForm(); }}
            loading={submitting}
            submitText={editing ? t('common.save') : t('common.add')}
          />
        )}
        unmountOnExit
      >
        <Form form={form} layout="vertical">
          <Space direction="vertical" size={20} className="dialog-form-stack">
            <FormSection title={t('common.basicInfo')}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.dept.parentId')} field="parentId">
                    <TreeSelect treeData={deptOptions} disabled={editing?.isRoot} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.dept.deptName')} field="deptName" rules={[{ required: true, message: t('system.dept.deptNameRequired') }]}>
                    <Input />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem
                    label={t('system.dept.leaderCandidate')}
                    field="leaderUserId"
                    extra={editing
                      ? (leaderCandidates.length > 0 ? t('system.dept.leaderCandidateHint') : t('system.dept.leaderCandidateEmpty'))
                      : t('system.dept.leaderCandidateCreateHint')}
                  >
                    <Select
                      allowClear
                      showSearch
                      loading={leaderCandidateLoading}
                      disabled={!editing || editing.isRoot}
                      placeholder={editing ? t('system.dept.leaderCandidatePlaceholder') : t('system.dept.leaderCandidateCreateHint')}
                      options={leaderCandidates.map((item) => ({
                        label: `${item.displayName} · ${item.postName || '-'}`,
                        value: item.userId,
                      }))}
                      onChange={handleLeaderCandidateChange}
                    />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.dept.leader')} field="leader">
                    <Input placeholder={t('system.dept.leaderLegacyPlaceholder')} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.dept.phone')} field="phone">
                    <Input />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.dept.email')} field="email" rules={[{ match: /\S+@\S+\.\S+/, message: t('system.user.email.invalid') }]}>
                    <Input />
                  </FormItem>
                </Col>
                <Col xs={24} md={6}>
                  <FormItem label={t('system.dept.sort')} field="sort">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </FormItem>
                </Col>
                <Col xs={24} md={6}>
                  <FormItem label={t('system.dept.status')} field="status">
                    <Select options={[
                      { label: t('system.user.status.enabled'), value: 1 },
                      { label: t('system.user.status.disabled'), value: 2 },
                    ]} disabled={editing?.isRoot} />
                  </FormItem>
                </Col>
              </Row>
            </FormSection>
          </Space>
        </Form>
      </AppModal>

      <AppModal
        title={t('system.dept.batchLeader')}
        visible={leaderVisible}
        size="lg"
        onCancel={() => {
          setLeaderVisible(false);
          setBatchLeaderTasks([]);
          leaderForm.resetFields();
        }}
        footer={(
          <SubmitBar
            onCancel={() => {
              setLeaderVisible(false);
              setBatchLeaderTasks([]);
              leaderForm.resetFields();
            }}
            onSubmit={() => { void submitBatchLeader(); }}
            submitText={t('common.save')}
          />
        )}
        unmountOnExit
      >
        <Form form={leaderForm} layout="vertical">
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>{t('system.dept.batchLeaderTaskHint')}</div>
            {batchLeaderTasks.map((task) => (
              <Card key={task.deptId} size="small">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <strong>{task.deptName}</strong>
                  <FormItem
                    label={t('system.dept.leaderCandidate')}
                    field={String(task.deptId)}
                    rules={[{ required: true, message: t('dept.leader.required') }]}
                    extra={task.candidates.length > 0 ? t('system.dept.leaderCandidateHint') : t('system.dept.batchLeaderNoCandidate')}
                  >
                    <Select
                      showSearch
                      allowClear
                      loading={leaderCandidateLoading}
                      disabled={task.candidates.length === 0}
                      placeholder={task.candidates.length > 0 ? t('system.dept.leaderCandidatePlaceholder') : t('system.dept.batchLeaderNoCandidate')}
                      options={task.candidates.map((item) => ({
                        label: `${item.displayName} · ${item.postName || '-'}`,
                        value: item.userId,
                      }))}
                    />
                  </FormItem>
                </Space>
              </Card>
            ))}
          </Space>
        </Form>
      </AppModal>

      <AppModal
        title={t('system.dept.orgCreatePostTitle')}
        visible={postVisible}
        size="md"
        onCancel={() => {
          setPostVisible(false);
          setCreatingPostDept(null);
        }}
        footer={(
          <SubmitBar
            onCancel={() => {
              setPostVisible(false);
              setCreatingPostDept(null);
            }}
            onSubmit={() => { void submitPostForm(); }}
            loading={postSubmitting}
            submitText={t('common.add')}
          />
        )}
        unmountOnExit
      >
        <Form form={postForm} layout="vertical">
          <Space direction="vertical" size={20} className="dialog-form-stack">
            <FormSection title={t('common.basicInfo')}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.post.dept')} field="deptId" rules={[{ required: true, message: t('system.post.deptRequired') }]}>
                    <Select disabled options={creatingPostDept ? [{ label: creatingPostDept.deptName, value: creatingPostDept.id }] : []} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.post.postCode')} field="postCode" rules={[{ required: true, message: t('system.post.postCodeRequired') }]}>
                    <Input />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.post.postName')} field="postName" rules={[{ required: true, message: t('system.post.postNameRequired') }]}>
                    <Input />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.post.sort')} field="sort">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.post.status')} field="status">
                    <Select options={[
                      { label: t('system.user.status.enabled'), value: 1 },
                      { label: t('system.user.status.disabled'), value: 2 },
                    ]} />
                  </FormItem>
                </Col>
                <Col span={24}>
                  <FormItem label={t('system.post.remark')} field="remark">
                    <Input.TextArea maxLength={200} autoSize={{ minRows: 3, maxRows: 5 }} />
                  </FormItem>
                </Col>
              </Row>
            </FormSection>
          </Space>
        </Form>
      </AppModal>

      <AppModal
        title={t('system.user.detail')}
        visible={userDetailVisible}
        size="detail"
        footer={null}
        onCancel={() => setUserDetailVisible(false)}
        unmountOnExit
      >
        {userDetailLoading ? <PageLoading /> : null}
        {userDetailError ? <PageError onRetry={() => { if (userDetailId > 0) { void openUserDetail(userDetailId); } }} /> : null}
        {!userDetailLoading && !userDetailError && userDetail ? <UserDetailContent detail={userDetail} /> : null}
      </AppModal>
    </PageContainer>
  );
};

export default DeptList;
