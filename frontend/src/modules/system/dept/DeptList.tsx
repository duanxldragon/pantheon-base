import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Grid,
  Input,
  InputNumber,
  Message,
  Popconfirm,
  Select,
  Space,
  Tabs,
  Tag,
  TreeSelect,
} from '@arco-design/web-react';
import { IconDelete, IconDownload, IconEdit, IconEye, IconPlus, IconSearch } from '@arco-design/web-react/icon';
import type { ColumnProps, SorterInfo, TableProps } from '@arco-design/web-react/es/Table/interface';
import type { TreeSelectDataType } from '@arco-design/web-react/es/TreeSelect/interface';
import { useTranslation } from 'react-i18next';
import { showImportResult } from '../../../api/importExport';
import { isNetworkRequestError, isServerRequestError, isTimeoutRequestError } from '../../../api/request';
import { usePermission } from '../../../hooks/usePermission';
import { batchUpdateDeptStatus, createDept, deleteDept, downloadDeptImportTemplate, exportDepts, getDeptTree, importDepts, updateDept, type DeptListQuery, type DeptNode, type DeptPayload } from './api';
import { createPost, getPostList, type PostPayload, type PostRow } from '../post/api';
import { getUserDetail, getUserList, type UserDetail as UserDetailData, type UserListRow } from '../user/api';
import UserDetailContent from '../user/UserDetailContent';
import { AppModal, AppTable, FilterPanel, FormSection, ImportCsvButton, PageActions, PageContainer, PageEmpty, PageError, PageHeader, PageLoading, PageNetworkError, PageServerError, SubmitBar } from '../../../components';
import '../list-page.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

interface DeptFormValues {
  parentId: string;
  deptName: string;
  sort: number;
  leader?: string;
  phone?: string;
  email?: string;
  status: number;
}

type OrgPostFormValues = PostPayload;

const emptyQuery: DeptListQuery = {
  deptName: '',
  status: undefined,
  sortField: 'sort',
  sortOrder: 'asc',
};

const emptyForm: DeptFormValues = {
  parentId: '0',
  deptName: '',
  sort: 0,
  leader: '',
  phone: '',
  email: '',
  status: 1,
};

const orgChartPageSize = 1000;

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
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);
  const [query, setQuery] = useState<DeptListQuery>(emptyQuery);
  const [form] = Form.useForm<DeptFormValues>();
  const [postForm] = Form.useForm<OrgPostFormValues>();
  const [queryForm] = Form.useForm<DeptListQuery>();

  const loadData = useCallback(async (nextQuery: DeptListQuery = query) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getDeptTree(nextQuery);
      setData(rows);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadAllDepts = useCallback(async () => {
    try {
      const rows = await getDeptTree({ sortField: 'sort', sortOrder: 'asc' });
      setAllDeptTree(rows);
    } catch {
      Message.error(t('common.loadFailed'));
    }
  }, [t]);

  const loadOrgData = useCallback(async () => {
    setOrgLoading(true);
    setOrgError(null);
    try {
      const [deptRows, postRows, userRows] = await Promise.all([
        getDeptTree({ sortField: 'sort', sortOrder: 'asc' }),
        canViewPosts
          ? getPostList({ page: 1, pageSize: orgChartPageSize, sortField: 'sort', sortOrder: 'asc' })
          : Promise.resolve({ items: [], total: 0, page: 1, pageSize: orgChartPageSize }),
        canViewUsers
          ? getUserList({ page: 1, pageSize: orgChartPageSize, sortField: 'username', sortOrder: 'asc' })
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
      setOrgLoading(false);
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

  const openCreate = () => {
    const rootDept = findRootDept(allDeptTree);
    setEditing(null);
    form.setFieldsValue({
      ...emptyForm,
      parentId: rootDept ? String(rootDept.id) : emptyForm.parentId,
    });
    setVisible(true);
  };

  const openEdit = (row: DeptNode) => {
    setEditing(row);
    form.setFieldsValue({
      parentId: row.isRoot ? String(row.id) : String(row.parentId),
      deptName: row.deptName,
      sort: row.sort,
      leader: row.leader,
      phone: row.phone,
      email: row.email,
      status: row.status,
    });
    setVisible(true);
  };

  const submitForm = async () => {
    const values = await form.validate();
    const payload: DeptPayload = {
      ...values,
      parentId: editing?.isRoot ? 0 : Number(values.parentId || 0),
    };
    setSubmitting(true);
    try {
      if (editing) {
        await updateDept(editing.id, payload);
        Message.success(t('common.updateSuccess'));
      } else {
        await createDept(payload);
        Message.success(t('common.createSuccess'));
      }
      setVisible(false);
      await loadData(query);
      await loadAllDepts();
      if (activeTab === 'org') {
        await loadOrgData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const removeDept = async (id: number) => {
    await deleteDept(id);
    Message.success(t('common.deleteSuccess'));
    setSelectedRowKeys((keys) => keys.filter((key) => Number(key) !== id));
    await loadData(query);
    await loadAllDepts();
    if (activeTab === 'org') {
      await loadOrgData();
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
      width: 180,
      fixed: 'right',
      render: (_: unknown, row: DeptNode) => (
        <Space size={4} className="system-list__actions">
          {canEdit ? (
            <Button type="text" size="small" icon={<IconEdit />} onClick={() => openEdit(row)}>
              {t('common.edit')}
            </Button>
          ) : null}
          {canDelete ? (
            <Popconfirm title={t('common.deleteConfirm')} onOk={() => removeDept(row.id)} disabled={row.isRoot}>
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

  const handleDownloadTemplate = async () => {
    await downloadDeptImportTemplate();
  };

  const handleImport = async (file: File) => {
    const result = await importDepts(file);
    showImportResult(result, t);
    if (result.applied) {
      await loadData(query);
      await loadAllDepts();
      if (activeTab === 'org') {
        await loadOrgData();
      }
    }
  };

  const handleBatchStatus = async (status: 1 | 2) => {
    const deptIds = selectedRowKeys.map((item) => Number(item)).filter((item) => item > 0);
    const result = await batchUpdateDeptStatus({ deptIds, status });
    Message.success(t('system.dept.batchStatusSuccess', { count: result.updatedCount }));
    setSelectedRowKeys([]);
    await loadData(query);
    await loadAllDepts();
    if (activeTab === 'org') {
      await loadOrgData();
    }
  };

  const batchActionDisabled = !canBatchUpdate || selectedRowKeys.length === 0;

  const openCreatePost = () => {
    if (!selectedOrgDept || selectedOrgDept.isRoot) {
      return;
    }
    postForm.setFieldsValue({
      deptId: selectedOrgDept.id,
      postCode: '',
      postName: '',
      sort: 0,
      status: 1,
      remark: '',
    });
    setPostVisible(true);
  };

  const submitPostForm = async () => {
    const values = await postForm.validate();
    setPostSubmitting(true);
    try {
      await createPost(values);
      Message.success(t('common.createSuccess'));
      setPostVisible(false);
      await loadOrgData();
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
        title={t('system.menu.dept')}
        subtitle={t('system.dept.subtitle')}
        extra={activeTab === 'manage' ? (
          <PageActions>
            <Button icon={<IconDownload />} onClick={() => { void handleExport(); }} disabled={!canExport}>{t('common.export')}</Button>
            <Button onClick={() => { void handleDownloadTemplate(); }} disabled={!canImport}>{t('common.downloadTemplate')}</Button>
            <ImportCsvButton disabled={!canImport} onSelect={(file) => { void handleImport(file); }}>
              {t('common.import')}
            </ImportCsvButton>
            <Popconfirm title={t('system.dept.batchEnableConfirm')} onOk={() => { void handleBatchStatus(1); }} disabled={batchActionDisabled}>
              <Button disabled={batchActionDisabled}>{t('system.dept.batchEnable')}</Button>
            </Popconfirm>
            <Popconfirm title={t('system.dept.batchDisableConfirm')} onOk={() => { void handleBatchStatus(2); }} disabled={batchActionDisabled}>
              <Button status={batchActionDisabled ? undefined : 'warning'} disabled={batchActionDisabled}>{t('system.dept.batchDisable')}</Button>
            </Popconfirm>
            <Button type="primary" icon={<IconPlus />} onClick={openCreate} disabled={!canCreate}>{t('common.add')}</Button>
          </PageActions>
        ) : (
          <PageActions>
            <Button onClick={() => { void loadOrgData(); }} loading={orgLoading}>{t('common.refresh')}</Button>
          </PageActions>
        )}
      />
      <Tabs activeTab={activeTab} onChange={setActiveTab} className="system-dept-tabs">
        <Tabs.TabPane key="manage" title={t('system.dept.manageTab')}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
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
                  scroll={{ x: 1100 }}
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
          </Space>
        </Tabs.TabPane>
        <Tabs.TabPane key="org" title={t('system.dept.orgTab')}>
          {renderOrgView()}
        </Tabs.TabPane>
      </Tabs>

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
                  <FormItem label={t('system.dept.leader')} field="leader">
                    <Input />
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
        title={t('system.dept.orgCreatePostTitle')}
        visible={postVisible}
        size="md"
        onCancel={() => setPostVisible(false)}
        footer={(
          <SubmitBar
            onCancel={() => setPostVisible(false)}
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
                    <Select disabled options={selectedOrgDept ? [{ label: selectedOrgDept.deptName, value: selectedOrgDept.id }] : []} />
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
