import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Grid, Input, InputNumber, Message, Popconfirm, Select, Space, Tag, Tree, Typography } from '@arco-design/web-react';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/interface';
import type { ColumnProps, SorterInfo, TableProps } from '@arco-design/web-react/es/Table/interface';
import type { TreeDataType } from '@arco-design/web-react/es/Tree/interface';
import { IconDelete, IconDownload, IconEdit, IconPlus, IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { isNetworkRequestError, isServerRequestError, isTimeoutRequestError } from '../../../api/request';
import { formatDateTime } from '../../../core/format/dateTime';
import { usePermission } from '../../../hooks/usePermission';
import { getMenuTree, type MenuNode } from '../menu/api';
import { batchUpdateRoleStatus, createRole, deleteRole, exportRoles, getRoleList, updateRole, type RoleListQuery, type RolePayload, type RoleRow } from './api';
import { AppModal, AppTable, FilterPanel, FormSection, PageActions, PageContainer, PageEmpty, PageError, PageHeader, PageLoading, PageNetworkError, PageServerError, SubmitBar } from '../../../components';
import '../list-page.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

interface RoleFormValues {
  roleName: string;
  roleKey: string;
  sort: number;
  status: number;
  menuIds: string[];
  pagePermissionKeys: string[];
  actionPermissionKeys: string[];
  unknownPermissionKeys: string[];
}

const emptyForm: RoleFormValues = {
  roleName: '',
  roleKey: '',
  sort: 0,
  status: 1,
  menuIds: [],
  pagePermissionKeys: [],
  actionPermissionKeys: [],
  unknownPermissionKeys: [],
};

const emptyQuery: RoleListQuery = {
  roleName: '',
  roleKey: '',
  status: undefined,
  page: 1,
  pageSize: 10,
};

const emptyAuthorizationCounts = {
  navigation: 0,
  page: 0,
  action: 0,
  unknown: 0,
};

const mergePermissionKeys = (...groups: string[][]) => Array.from(new Set(groups.flat().filter(Boolean)));

interface PermissionTreeSelectorProps {
  treeData: TreeDataType[];
  permissionKeys: Set<string>;
  defaultExpandedKeys: string[];
  value?: string[];
  onChange?: (nextValue: string[]) => void;
  emptyText: string;
  searchPlaceholder: string;
  expandAllText: string;
  collapseAllText: string;
}

const PermissionTreeSelector: React.FC<PermissionTreeSelectorProps> = ({
  treeData,
  permissionKeys,
  defaultExpandedKeys,
  value = [],
  onChange,
  emptyText,
  searchPlaceholder,
  expandAllText,
  collapseAllText,
}) => {
  const [keyword, setKeyword] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(defaultExpandedKeys);

  useEffect(() => {
    setExpandedKeys(defaultExpandedKeys);
  }, [defaultExpandedKeys]);

  const collectExpandableKeys = useCallback((nodes: TreeDataType[]) => {
    const nextKeys: string[] = [];
    const walk = (items: TreeDataType[]) => {
      items.forEach((item) => {
        const children = Array.isArray(item.children) ? item.children : [];
        if (children.length > 0) {
          nextKeys.push(String(item.key));
          walk(children);
        }
      });
    };
    walk(nodes);
    return nextKeys;
  }, []);

  const filteredTreeData = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return treeData;
    }
    const walk = (nodes: TreeDataType[]): TreeDataType[] =>
      nodes.reduce<TreeDataType[]>((items, node) => {
        const children = Array.isArray(node.children) ? walk(node.children) : [];
        const searchText = String(node.searchText || '').toLowerCase();
        if (!searchText.includes(normalizedKeyword) && children.length === 0) {
          return items;
        }
        items.push({
          ...node,
          children: children.length > 0 ? children : undefined,
        });
        return items;
      }, []);
    return walk(treeData);
  }, [keyword, treeData]);

  const effectiveExpandedKeys = useMemo(() => {
    if (keyword.trim()) {
      return collectExpandableKeys(filteredTreeData);
    }
    return expandedKeys;
  }, [collectExpandableKeys, expandedKeys, filteredTreeData, keyword]);

  if (treeData.length === 0) {
    return <PageEmpty description={emptyText} />;
  }

  return (
    <div className="role-permission-tree-panel">
      <div className="role-permission-tree__toolbar">
        <Input
          allowClear
          className="role-permission-tree__search"
          prefix={<IconSearch />}
          placeholder={searchPlaceholder}
          value={keyword}
          onChange={setKeyword}
        />
        <Space size={4}>
          <Button type="text" size="mini" onClick={() => setExpandedKeys(collectExpandableKeys(treeData))}>
            {expandAllText}
          </Button>
          <Button type="text" size="mini" onClick={() => setExpandedKeys([])}>
            {collapseAllText}
          </Button>
        </Space>
      </div>
      <Tree
        className="role-permission-tree"
        blockNode
        checkable
        selectable={false}
        showLine
        expandedKeys={effectiveExpandedKeys}
        autoExpandParent
        checkedKeys={value}
        treeData={filteredTreeData}
        onExpand={(nextExpandedKeys) => setExpandedKeys(nextExpandedKeys)}
        onCheck={(checkedKeys) => {
          onChange?.(checkedKeys.filter((permissionKey) => permissionKeys.has(permissionKey)));
        }}
      />
    </div>
  );
};

const RoleList: React.FC = () => {
  const [data, setData] = useState<RoleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [query, setQuery] = useState<RoleListQuery>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);
  const [menuTree, setMenuTree] = useState<MenuNode[]>([]);
  const [authorizationCounts, setAuthorizationCounts] = useState(emptyAuthorizationCounts);
  const [form] = Form.useForm<RoleFormValues>();
  const [queryForm] = Form.useForm<RoleListQuery>();
  const { t } = useTranslation();
  const { isAdmin, hasPerm } = usePermission();
  const canCreate = isAdmin || hasPerm('system:role:create');
  const canEdit = isAdmin || hasPerm('system:role:update');
  const canDelete = isAdmin || hasPerm('system:role:delete');
  const canBatchUpdate = isAdmin || hasPerm('system:role:batch-update');
  const canExport = isAdmin || hasPerm('system:role:export');

  const loadData = useCallback(async (nextQuery: RoleListQuery = query) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRoleList(nextQuery);
      setData(result.items);
      setTotal(result.total);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadMenus = useCallback(async () => {
    try {
      const rows = await getMenuTree({ scope: 'manage' });
      setMenuTree(rows);
    } catch {
      Message.error(t('common.loadFailed'));
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData(query);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMenus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadMenus]);

  useEffect(() => {
    const visibleKeys = new Set(data.map((item) => item.id));
    setSelectedRowKeys((current) => current.filter((key) => visibleKeys.has(Number(key))));
  }, [data]);

  const permissionCatalog = useMemo(() => {
    const navigationKeys = new Set<string>();
    const pageKeys = new Set<string>();
    const actionKeys = new Set<string>();
    const walk = (nodes: MenuNode[]) => {
      nodes.forEach((item) => {
        if (item.type !== 'F') {
          navigationKeys.add(String(item.id));
        }
        if (item.type === 'C' && item.pagePerm && !pageKeys.has(item.pagePerm)) {
          pageKeys.add(item.pagePerm);
        }
        if (item.type === 'F' && item.perms && !actionKeys.has(item.perms)) {
          actionKeys.add(item.perms);
        }
        if (item.children?.length) {
          walk(item.children);
        }
      });
    };
    walk(menuTree);
    return {
      navigationKeys,
      pageKeys,
      actionKeys,
    };
  }, [menuTree]);

  const splitPermissionKeys = useCallback((permissionKeys: string[] = []) => {
    const pagePermissionKeys: string[] = [];
    const actionPermissionKeys: string[] = [];
    const unknownPermissionKeys: string[] = [];

    permissionKeys.forEach((permissionKey) => {
      if (permissionCatalog.pageKeys.has(permissionKey)) {
        pagePermissionKeys.push(permissionKey);
        return;
      }
      if (permissionCatalog.actionKeys.has(permissionKey)) {
        actionPermissionKeys.push(permissionKey);
        return;
      }
      unknownPermissionKeys.push(permissionKey);
    });

    return {
      pagePermissionKeys,
      actionPermissionKeys,
      unknownPermissionKeys,
    };
  }, [permissionCatalog]);

  const updateAuthorizationCounts = (values: Partial<RoleFormValues>) => {
    setAuthorizationCounts({
      navigation: values.menuIds?.length || 0,
      page: values.pagePermissionKeys?.length || 0,
      action: values.actionPermissionKeys?.length || 0,
      unknown: values.unknownPermissionKeys?.length || 0,
    });
  };

  const authorizationTitle = (label: string, count: number, color: string) => (
    <Space size={8}>
      <Typography.Text style={{ fontWeight: 600 }}>{label}</Typography.Text>
      <Tag color={color}>{t('system.role.selectedCount', { count })}</Tag>
    </Space>
  );

  const navigationPermissionTree = useMemo(() => {
    const expandedKeys: string[] = [];
    const buildTree = (nodes: MenuNode[]): TreeDataType[] =>
      nodes
        .filter((item) => item.type !== 'F')
        .map((item) => ({
          key: String(item.id),
          searchText: `${t(item.titleKey)} ${item.path || ''}`,
          title: (
            <span className="role-permission-tree__node">
              <span className="role-permission-tree__title">{t(item.titleKey)}</span>
              {item.path ? <Tag size="small" color="arcoblue">{item.path}</Tag> : null}
            </span>
          ),
          children: item.children?.length ? buildTree(item.children) : undefined,
        }));
    const treeData = buildTree(menuTree);
    treeData.forEach((item) => {
      if (Array.isArray(item.children) && item.children.length > 0) {
        expandedKeys.push(String(item.key));
      }
    });
    return {
      treeData,
      expandedKeys,
    };
  }, [menuTree, t]);

  const pagePermissionTree = useMemo(() => {
    const expandedKeys: string[] = [];
    const buildTree = (nodes: MenuNode[], depth = 0): TreeDataType[] =>
      nodes
        .filter((item) => item.type !== 'F')
        .map((item) => {
          const children = item.children?.length ? buildTree(item.children, depth + 1) : [];
          if (!item.pagePerm && children.length === 0) {
            return null;
          }
          const key = item.pagePerm || `menu-${item.id}`;
          if (children.length > 0 && depth === 0) {
            expandedKeys.push(key);
          }
          return {
            key,
            searchText: `${t(item.titleKey)} ${item.pagePerm || ''}`,
            disableCheckbox: !item.pagePerm && children.length === 0,
            title: (
              <span className="role-permission-tree__node">
                <span className="role-permission-tree__title">{t(item.titleKey)}</span>
                {item.pagePerm ? <Tag size="small" color="green">{item.pagePerm}</Tag> : null}
              </span>
            ),
            children: children.length > 0 ? children : undefined,
          } as TreeDataType;
        })
        .filter((item): item is TreeDataType => Boolean(item));
    return {
      treeData: buildTree(menuTree),
      expandedKeys,
    };
  }, [menuTree, t]);

  const actionPermissionTree = useMemo(() => {
    const expandedKeys: string[] = [];
    const buildTree = (nodes: MenuNode[], depth = 0): TreeDataType[] =>
      nodes
        .map((item) => {
          if (item.type === 'F') {
            if (!item.perms) {
              return null;
            }
            return {
              key: item.perms,
              searchText: `${t(item.titleKey)} ${item.perms}`,
              title: (
                <span className="role-permission-tree__node">
                  <span className="role-permission-tree__title">{t(item.titleKey)}</span>
                  <Tag size="small" color="orange">{item.perms}</Tag>
                </span>
              ),
            } as TreeDataType;
          }
          const children = item.children?.length ? buildTree(item.children, depth + 1) : [];
          if (children.length === 0) {
            return null;
          }
          const key = `action-menu-${item.id}`;
          if (depth === 0) {
            expandedKeys.push(key);
          }
          return {
            key,
            searchText: `${t(item.titleKey)} ${item.pagePerm || ''}`,
            disableCheckbox: children.length === 0,
            title: (
              <span className="role-permission-tree__node">
                <span className="role-permission-tree__title">{t(item.titleKey)}</span>
                {item.pagePerm ? <Tag size="small" color="arcoblue">{item.pagePerm}</Tag> : null}
              </span>
            ),
            children,
          } as TreeDataType;
        })
        .filter((item): item is TreeDataType => Boolean(item));
    return {
      treeData: buildTree(menuTree),
      expandedKeys,
    };
  }, [menuTree, t]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue(emptyForm);
    updateAuthorizationCounts(emptyForm);
    setVisible(true);
  };

  const openEdit = (row: RoleRow) => {
    const splitPermissions = splitPermissionKeys(row.permissionKeys);
    const formValues = {
      roleName: row.roleName,
      roleKey: row.roleKey,
      sort: row.sort,
      status: row.status,
      menuIds: row.menuIds.map(String),
      ...splitPermissions,
    };
    setEditing(row);
    form.setFieldsValue(formValues);
    updateAuthorizationCounts(formValues);
    setVisible(true);
  };

  const submitForm = async () => {
    const values = await form.validate();
    const payload: RolePayload = {
      roleName: values.roleName,
      roleKey: values.roleKey,
      sort: values.sort,
      status: values.status,
      menuIds: values.menuIds.map((item) => Number(item)),
      permissionKeys: mergePermissionKeys(values.pagePermissionKeys, values.actionPermissionKeys, values.unknownPermissionKeys),
    };
    setSubmitting(true);
    try {
      if (editing) {
        await updateRole(editing.id, payload);
        Message.success(t('common.updateSuccess'));
      } else {
        await createRole(payload);
        Message.success(t('common.createSuccess'));
      }
      setVisible(false);
      await loadData(query);
    } finally {
      setSubmitting(false);
    }
  };

  const removeRole = async (row: RoleRow) => {
    await deleteRole(row.id);
    Message.success(t('common.deleteSuccess'));
    setSelectedRowKeys((keys) => keys.filter((key) => Number(key) !== row.id));
    const nextPage = data.length === 1 && (query.page || 1) > 1 ? (query.page || 1) - 1 : (query.page || 1);
    const nextQuery = { ...query, page: nextPage };
    setQuery(nextQuery);
  };

  const handleBatchStatus = async (status: 1 | 2) => {
    const roleIds = selectedRowKeys.map((item) => Number(item)).filter((item) => item > 0);
    const result = await batchUpdateRoleStatus({ roleIds, status });
    Message.success(t('system.role.batchStatusSuccess', { count: result.updatedCount }));
    setSelectedRowKeys([]);
    await loadData(query);
  };

  const handleExport = async () => {
    await exportRoles(query);
  };

  const search = () => {
    const values = queryForm.getFieldsValue();
    setSelectedRowKeys([]);
    setQuery({
      ...query,
      ...values,
      page: 1,
    });
  };

  const reset = () => {
    queryForm.setFieldsValue(emptyQuery);
    setSelectedRowKeys([]);
    setQuery(emptyQuery);
  };

  const toArcoSortOrder = (sortOrder?: RoleListQuery['sortOrder']) => {
    if (sortOrder === 'asc') {
      return 'ascend';
    }
    if (sortOrder === 'desc') {
      return 'descend';
    }
    return undefined;
  };

  const sortableColumn = (field: NonNullable<RoleListQuery['sortField']>): Partial<ColumnProps<RoleRow>> => ({
    sorter: true,
    sortOrder: query.sortField === field ? toArcoSortOrder(query.sortOrder) : undefined,
  });

  const handleTableChange: TableProps<RoleRow>['onChange'] = (pagination, sorter) => {
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter as SorterInfo | undefined;
    const nextQuery: RoleListQuery = {
      ...query,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || query.pageSize || emptyQuery.pageSize,
      sortField: currentSorter?.direction ? String(currentSorter.field) : undefined,
      sortOrder: currentSorter?.direction === 'ascend' ? 'asc' : currentSorter?.direction === 'descend' ? 'desc' : undefined,
    };
    setSelectedRowKeys([]);
    setQuery(nextQuery);
  };

  const columns: ColumnProps<RoleRow>[] = [
    { title: t('system.role.roleName'), dataIndex: 'roleName', width: 180, ...sortableColumn('roleName') },
    { title: t('system.role.roleKey'), dataIndex: 'roleKey', width: 180, ...sortableColumn('roleKey') },
    { title: t('system.role.sort'), dataIndex: 'sort', width: 120, ...sortableColumn('sort') },
    {
      title: t('system.role.status'),
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
      title: t('system.role.createdAt'),
      dataIndex: 'createdAt',
      width: 180,
      ...sortableColumn('createdAt'),
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('common.action'),
      width: 180,
      fixed: 'right',
      render: (_: unknown, row: RoleRow) => (
        <Space size={4} className="system-list__actions">
          {canEdit ? (
            <Button type="text" size="small" icon={<IconEdit />} onClick={() => openEdit(row)}>
              {t('common.edit')}
            </Button>
          ) : null}
          {canDelete ? (
            <Popconfirm title={t('common.deleteConfirm')} onOk={() => removeRole(row)} disabled={row.roleKey === 'admin'}>
              <Button type="text" size="small" status="danger" icon={<IconDelete />} disabled={row.roleKey === 'admin'}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  const protectedRole = editing?.roleKey === 'admin';
  const unknownPermissionKeys = form.getFieldValue('unknownPermissionKeys');
  const unknownPermissionOptions = Array.isArray(unknownPermissionKeys)
    ? unknownPermissionKeys.map((permissionKey) => ({
      label: String(permissionKey),
      value: String(permissionKey),
    }))
    : [];

  const renderErrorState = () => {
    if (isNetworkRequestError(error)) {
      return <PageNetworkError timeout={isTimeoutRequestError(error)} onRetry={() => { void loadData(query); }} />;
    }
    if (isServerRequestError(error)) {
      return <PageServerError onRetry={() => { void loadData(query); }} />;
    }
    return <PageError onRetry={() => { void loadData(query); }} />;
  };

  const batchActionDisabled = !canBatchUpdate || selectedRowKeys.length === 0;

  return (
    <PageContainer>
      <PageHeader
        title={t('system.menu.role')}
        extra={(
          <PageActions>
            <Button icon={<IconDownload />} onClick={() => { void handleExport(); }} disabled={!canExport}>
              {t('common.export')}
            </Button>
            <Popconfirm title={t('system.role.batchEnableConfirm')} onOk={() => { void handleBatchStatus(1); }} disabled={batchActionDisabled}>
              <Button disabled={batchActionDisabled}>
                {t('system.role.batchEnable')}
              </Button>
            </Popconfirm>
            <Popconfirm title={t('system.role.batchDisableConfirm')} onOk={() => { void handleBatchStatus(2); }} disabled={batchActionDisabled}>
              <Button status={batchActionDisabled ? undefined : 'warning'} disabled={batchActionDisabled}>
                {t('system.role.batchDisable')}
              </Button>
            </Popconfirm>
            <Button type="primary" icon={<IconPlus />} onClick={openCreate} disabled={!canCreate}>{t('common.add')}</Button>
          </PageActions>
        )}
      />
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <FilterPanel>
          <Form form={queryForm} layout="vertical">
            <Row gutter={16}>
              <Col span={6}>
                <FormItem label={t('system.role.roleName')} field="roleName">
                  <Input />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem label={t('system.role.roleKey')} field="roleKey">
                  <Input />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem label={t('system.role.status')} field="status">
                  <Select allowClear options={[
                    { label: t('system.user.status.enabled'), value: 1 },
                    { label: t('system.user.status.disabled'), value: 2 },
                  ]} />
                </FormItem>
              </Col>
              <Col span={6}>
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
            <AppTable<RoleRow>
              className="system-list__table"
              data={data}
              columns={columns}
              rowKey="id"
              loading={loading}
              scroll={{ x: 980 }}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                fixed: true,
                checkboxProps: (row) => ({ disabled: row.roleKey === 'admin' }),
                onChange: (rowKeys) => setSelectedRowKeys(rowKeys),
              }}
              onChange={handleTableChange}
              emptyText={t('common.noData')}
              pagination={{
                current: query.page || emptyQuery.page,
                pageSize: query.pageSize || emptyQuery.pageSize,
                total,
                showJumper: true,
                pageSizeChangeResetCurrent: false,
                sizeCanChange: true,
                sizeOptions: [10, 20, 50, 100],
                size: 'small',
                showTotal: (count: number) => t('common.total', { count }),
              } as PaginationProps}
            />
          ) : null}
        </Card>
      </Space>

      <AppModal
        title={editing ? t('system.role.edit') : t('system.role.create')}
        visible={visible}
        size="xl"
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
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(_, values) => updateAuthorizationCounts(values)}
        >
          <Space direction="vertical" size={20} className="dialog-form-stack">
            <FormSection title={t('common.basicInfo')}>
              <FormItem label={t('system.role.roleName')} field="roleName" rules={[{ required: true, message: t('system.role.roleName.required') }]}>
                <Input />
              </FormItem>
              <FormItem label={t('system.role.roleKey')} field="roleKey" rules={[{ required: true, message: t('system.role.roleKey.required') }]}>
                <Input disabled={protectedRole} />
              </FormItem>
              <FormItem label={t('system.role.sort')} field="sort">
                <InputNumber min={0} />
              </FormItem>
              <FormItem label={t('system.role.status')} field="status">
                <Select
                  disabled={protectedRole}
                  options={[
                    { label: t('system.user.status.enabled'), value: 1 },
                    { label: t('system.user.status.disabled'), value: 2 },
                  ]}
                />
              </FormItem>
            </FormSection>
            <FormSection
              title={t('common.accessControl')}
              description={t('system.role.accessControlDesc')}
            >
              <Alert type="info" content={t('system.role.apiPolicyHint')} />
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card
                    className="dialog-grid-card"
                    size="small"
                    title={authorizationTitle(t('system.role.navigationAuth'), authorizationCounts.navigation, 'arcoblue')}
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Typography.Text type="secondary">{t('system.role.navigationAuthHint')}</Typography.Text>
                      <FormItem label={t('system.role.menuIds')} field="menuIds">
                        <PermissionTreeSelector
                          treeData={navigationPermissionTree.treeData}
                          defaultExpandedKeys={navigationPermissionTree.expandedKeys}
                          permissionKeys={permissionCatalog.navigationKeys}
                          emptyText={t('system.role.permissionTree.empty')}
                          searchPlaceholder={t('system.role.permissionTree.searchPlaceholder')}
                          expandAllText={t('system.role.permissionTree.expandAll')}
                          collapseAllText={t('system.role.permissionTree.collapseAll')}
                        />
                      </FormItem>
                    </Space>
                  </Card>
                </Col>
                <Col span={24}>
                  <Card
                    className="dialog-grid-card"
                    size="small"
                    title={authorizationTitle(t('system.role.pageAuth'), authorizationCounts.page, 'green')}
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Typography.Text type="secondary">{t('system.role.pageAuthHint')}</Typography.Text>
                      <FormItem label={t('system.role.pagePermissionKeys')} field="pagePermissionKeys">
                        <PermissionTreeSelector
                          treeData={pagePermissionTree.treeData}
                          defaultExpandedKeys={pagePermissionTree.expandedKeys}
                          permissionKeys={permissionCatalog.pageKeys}
                          emptyText={t('system.role.permissionTree.empty')}
                          searchPlaceholder={t('system.role.permissionTree.searchPlaceholder')}
                          expandAllText={t('system.role.permissionTree.expandAll')}
                          collapseAllText={t('system.role.permissionTree.collapseAll')}
                        />
                      </FormItem>
                    </Space>
                  </Card>
                </Col>
                <Col span={24}>
                  <Card
                    className="dialog-grid-card"
                    size="small"
                    title={authorizationTitle(t('system.role.actionAuth'), authorizationCounts.action, 'orange')}
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Typography.Text type="secondary">{t('system.role.actionAuthHint')}</Typography.Text>
                      <FormItem label={t('system.role.actionPermissionKeys')} field="actionPermissionKeys">
                        <PermissionTreeSelector
                          treeData={actionPermissionTree.treeData}
                          defaultExpandedKeys={actionPermissionTree.expandedKeys}
                          permissionKeys={permissionCatalog.actionKeys}
                          emptyText={t('system.role.permissionTree.empty')}
                          searchPlaceholder={t('system.role.permissionTree.searchPlaceholder')}
                          expandAllText={t('system.role.permissionTree.expandAll')}
                          collapseAllText={t('system.role.permissionTree.collapseAll')}
                        />
                      </FormItem>
                    </Space>
                  </Card>
                </Col>
                {authorizationCounts.unknown > 0 ? (
                  <Col span={24}>
                    <Card
                      className="dialog-grid-card dialog-grid-card--danger"
                      size="small"
                      title={authorizationTitle(t('system.role.unknownAuth'), authorizationCounts.unknown, 'red')}
                    >
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Typography.Text type="secondary">{t('system.role.unknownAuthHint')}</Typography.Text>
                        <FormItem label={t('system.role.unknownPermissionKeys')} field="unknownPermissionKeys">
                          <Select
                            mode="multiple"
                            disabled
                            options={unknownPermissionOptions}
                          />
                        </FormItem>
                      </Space>
                    </Card>
                  </Col>
                ) : null}
              </Row>
            </FormSection>
          </Space>
        </Form>
      </AppModal>
    </PageContainer>
  );
};

export default RoleList;
