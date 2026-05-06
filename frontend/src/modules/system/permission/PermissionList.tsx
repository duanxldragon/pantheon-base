import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Grid,
  Input,
  Popconfirm,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { message } from '../../../components/feedback/message';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/interface';
import type { ColumnProps, TableProps } from '@arco-design/web-react/es/Table/interface';
import {
  IconDelete,
  IconDownload,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
} from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { showImportResult } from '../../../api/importExport';
import {
  isNetworkRequestError,
  isServerRequestError,
  isTimeoutRequestError,
} from '../../../api/request';
import { isArcoFormValidationError } from '../../../core/arco/formValidation';
import { publishRefresh, useRefreshSubscription } from '../../../core/refresh/refreshBus';
import { invalidateRouteWarmDataMany, resolveRouteWarmData } from '../../../core/router/prefetch';
import { usePermission } from '../../../hooks/usePermission';
import { getRoleList } from '../role/api';
import {
  createPermissionPolicy,
  deletePermissionPolicy,
  downloadPermissionImportTemplate,
  exportPermissionWorkbench,
  exportPermissionPolicies,
  getPermissionWorkbenchRemediationEvents,
  getPermissionDataScopePolicies,
  getPermissionPolicyList,
  getPermissionWorkbench,
  importPermissionPolicies,
  remediatePermissionWorkbenchRole,
  updatePermissionDataScopePolicy,
  type PermissionDataScopeMode,
  type PermissionDataScopePolicy,
  type PermissionDataScopeQuery,
  updatePermissionPolicy,
  type PermissionPolicyPayload,
  type PermissionPolicyQuery,
  type PermissionPolicyRow,
  type PermissionWorkbenchQuery,
  type PermissionWorkbenchRemediationEvent,
  type PermissionWorkbenchRole,
  type PermissionWorkbenchResp,
} from './api';
import {
  AppModal,
  AppTable,
  FilterPanel,
  FormSection,
  GovernanceRailPanel,
  GovernanceRailSummary,
  GovernanceRailToggleButton,
  ImportCsvButton,
  ListHeaderActions,
  PageContainer,
  PageEmpty,
  PageError,
  PageHeader,
  PageLoading,
  PageNetworkError,
  PageServerError,
  PageSplitLayout,
  SubmitBar,
  TABLE_ACTION_COLUMN_WIDTH,
  useGovernanceRail,
  withTableColumnPriority,
} from '../../../components';
import '../list-page.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const emptyQuery: PermissionPolicyQuery = {
  roleKey: '',
  path: '',
  method: '',
  page: 1,
  pageSize: 10,
};

const emptyWorkbenchQuery: PermissionWorkbenchQuery = {
  roleKey: '',
  status: undefined,
  integrity: undefined,
  coverage: undefined,
};

function isDefaultPermissionPolicyQuery(query: PermissionPolicyQuery) {
  return (
    !query.roleKey &&
    !query.path &&
    !query.method &&
    (query.page ?? 1) === 1 &&
    (query.pageSize ?? 10) === 10
  );
}

function isDefaultPermissionWorkbenchQuery(query: PermissionWorkbenchQuery) {
  return (
    !query.roleKey &&
    query.status === undefined &&
    query.integrity === undefined &&
    query.coverage === undefined
  );
}

interface LoadDataOptions {
  silent?: boolean;
}

interface DataScopeEditorFormValues {
  mode: PermissionDataScopeMode;
  deptIdsText?: string;
}

const emptyForm: PermissionPolicyPayload = {
  roleKey: '',
  path: '',
  method: 'GET',
};

type PermissionTabKey = 'workbench' | 'data-scope' | 'api';

const PermissionList: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, hasPerm } = usePermission();
  const canCreate = isAdmin || hasPerm('system:permission:create');
  const canEdit = isAdmin || hasPerm('system:permission:update');
  const canDelete = isAdmin || hasPerm('system:permission:delete');
  const canExport = isAdmin || hasPerm('system:permission:export');
  const canImport = isAdmin || hasPerm('system:permission:import');
  const [activeTab, setActiveTab] = useState<PermissionTabKey>('workbench');
  const [data, setData] = useState<PermissionPolicyRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [policyError, setPolicyError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<PermissionPolicyRow | null>(null);
  const [query, setQuery] = useState<PermissionPolicyQuery>(emptyQuery);
  const [roleOptions, setRoleOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [workbenchLoading, setWorkbenchLoading] = useState(false);
  const [workbenchError, setWorkbenchError] = useState<unknown>(null);
  const [workbench, setWorkbench] = useState<PermissionWorkbenchResp | null>(null);
  const [workbenchQuery, setWorkbenchQuery] =
    useState<PermissionWorkbenchQuery>(emptyWorkbenchQuery);
  const [dataScopeRows, setDataScopeRows] = useState<PermissionDataScopePolicy[]>([]);
  const [dataScopeLoading, setDataScopeLoading] = useState(false);
  const [dataScopeError, setDataScopeError] = useState<unknown>(null);
  const [dataScopeQuery, setDataScopeQuery] = useState<PermissionDataScopeQuery>({});
  const [dataScopeSubmittingRoleKey, setDataScopeSubmittingRoleKey] = useState('');
  const [dataScopeEditingRow, setDataScopeEditingRow] = useState<PermissionDataScopePolicy | null>(
    null,
  );
  const [dataScopeModeDraft, setDataScopeModeDraft] = useState<PermissionDataScopeMode>('all');
  const [detailRole, setDetailRole] = useState<PermissionWorkbenchRole | null>(null);
  const [remediationEvents, setRemediationEvents] = useState<PermissionWorkbenchRemediationEvent[]>(
    [],
  );
  const [remediatingRoleKey, setRemediatingRoleKey] = useState<string>('');
  const [form] = Form.useForm<PermissionPolicyPayload>();
  const [queryForm] = Form.useForm<PermissionPolicyQuery>();
  const [workbenchForm] = Form.useForm<PermissionWorkbenchQuery>();
  const [dataScopeForm] = Form.useForm<PermissionDataScopeQuery>();
  const [dataScopeEditorForm] = Form.useForm<DataScopeEditorFormValues>();
  const governanceRail = useGovernanceRail();
  const invalidatePermissionCaches = useCallback(() => {
    invalidateRouteWarmDataMany([
      { path: '/system/permission', resourceKeys: ['list:default', 'workbench:default'] },
    ]);
  }, []);

  const loadData = useCallback(
    async (nextQuery: PermissionPolicyQuery = query, options?: LoadDataOptions) => {
      const silent = options?.silent === true;
      if (!silent) {
        setLoading(true);
        setPolicyError(null);
      }
      try {
        const result = isDefaultPermissionPolicyQuery(nextQuery)
          ? await resolveRouteWarmData('/system/permission', 'list:default', () =>
              getPermissionPolicyList(nextQuery),
            )
          : await getPermissionPolicyList(nextQuery);
        setData(result.items);
        setTotal(result.total);
      } catch (requestError) {
        setPolicyError(requestError);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [query],
  );

  const loadWorkbench = useCallback(
    async (nextQuery: PermissionWorkbenchQuery = workbenchQuery, options?: LoadDataOptions) => {
      const silent = options?.silent === true;
      if (!silent) {
        setWorkbenchLoading(true);
        setWorkbenchError(null);
      }
      try {
        const result = isDefaultPermissionWorkbenchQuery(nextQuery)
          ? await resolveRouteWarmData('/system/permission', 'workbench:default', () =>
              getPermissionWorkbench(nextQuery),
            )
          : await getPermissionWorkbench(nextQuery);
        setWorkbench(result);
        setDetailRole((current) =>
          current ? result.roles.find((item) => item.roleKey === current.roleKey) || null : current,
        );
      } catch (requestError) {
        setWorkbenchError(requestError);
      } finally {
        if (!silent) {
          setWorkbenchLoading(false);
        }
      }
    },
    [workbenchQuery],
  );

  const loadDataScopePolicies = useCallback(
    async (nextQuery: PermissionDataScopeQuery = dataScopeQuery, options?: LoadDataOptions) => {
      const silent = options?.silent === true;
      if (!silent) {
        setDataScopeLoading(true);
        setDataScopeError(null);
      }
      try {
        const result = await getPermissionDataScopePolicies(nextQuery);
        setDataScopeRows(result.items);
      } catch (requestError) {
        setDataScopeError(requestError);
      } finally {
        if (!silent) {
          setDataScopeLoading(false);
        }
      }
    },
    [dataScopeQuery],
  );

  const loadRoles = useCallback(async () => {
    try {
      const result = await resolveRouteWarmData('/system/permission', 'roles:default', () =>
        getRoleList({ page: 1, pageSize: 100, sortField: 'sort', sortOrder: 'asc' }),
      );
      setRoleOptions(
        result.items.map((item) => ({
          label: item.roleName,
          value: item.roleKey,
        })),
      );
    } catch {
      message.error(t('common.loadFailed'));
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(query), 0);
    return () => window.clearTimeout(timer);
  }, [loadData, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadWorkbench(workbenchQuery), 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkbench, workbenchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDataScopePolicies(dataScopeQuery), 0);
    return () => window.clearTimeout(timer);
  }, [loadDataScopePolicies, dataScopeQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRoles(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRoles]);

  useEffect(() => {
    let cancelled = false;
    if (!detailRole) {
      const timer = window.setTimeout(() => {
        if (!cancelled) {
          setRemediationEvents([]);
        }
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }
    void getPermissionWorkbenchRemediationEvents({ roleKey: detailRole.roleKey, limit: 5 })
      .then((events) => {
        if (!cancelled) {
          setRemediationEvents(events);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRemediationEvents([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [detailRole]);

  useRefreshSubscription(
    ['system:permission:changed', 'system:role:changed', 'system:menu:changed'],
    (payload) => {
      if (payload.source === 'system/permission') {
        return;
      }
      void loadWorkbench(workbenchQuery);
      void loadDataScopePolicies(dataScopeQuery);
      if (payload.topic !== 'system:menu:changed') {
        void loadData(query);
      }
      if (payload.topic === 'system:role:changed') {
        void loadRoles();
      }
    },
  );

  const handleExport = async () => {
    await exportPermissionPolicies(query);
  };

  const handleDownloadTemplate = async () => {
    await downloadPermissionImportTemplate();
  };

  const handleImport = async (file: File) => {
    const result = await importPermissionPolicies(file);
    showImportResult(result, t);
    if (result.applied) {
      invalidatePermissionCaches();
      publishRefresh('system:permission:changed', 'system/permission');
      await Promise.all([
        loadData(query, { silent: true }),
        loadWorkbench(workbenchQuery, { silent: true }),
      ]);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue(emptyForm);
    setVisible(true);
  };

  const openEdit = (row: PermissionPolicyRow) => {
    setEditing(row);
    form.setFieldsValue({
      roleKey: row.roleKey,
      path: row.path,
      method: row.method,
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
    setSubmitting(true);
    try {
      if (editing) {
        await updatePermissionPolicy(editing.id, values);
        message.success(t('common.updateSuccess'));
      } else {
        await createPermissionPolicy(values);
        message.success(t('common.createSuccess'));
      }
      invalidatePermissionCaches();
      publishRefresh('system:permission:changed', 'system/permission');
      setVisible(false);
      await Promise.all([
        loadData(query, { silent: true }),
        loadWorkbench(workbenchQuery, { silent: true }),
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const removePolicy = async (row: PermissionPolicyRow) => {
    await deletePermissionPolicy(row.id);
    message.success(t('common.deleteSuccess'));
    invalidatePermissionCaches();
    publishRefresh('system:permission:changed', 'system/permission');
    const nextPage =
      data.length === 1 && (query.page || 1) > 1 ? (query.page || 1) - 1 : query.page || 1;
    const nextQuery = { ...query, page: nextPage };
    setQuery(nextQuery);
    await loadWorkbench(workbenchQuery, { silent: true });
  };

  const search = () => {
    const values = queryForm.getFieldsValue();
    setQuery({
      ...query,
      ...values,
      page: 1,
    });
  };

  const reset = () => {
    queryForm.setFieldsValue(emptyQuery);
    setQuery(emptyQuery);
  };

  const searchWorkbench = () => {
    const values = workbenchForm.getFieldsValue();
    setWorkbenchQuery({
      ...workbenchQuery,
      ...values,
    });
  };

  const resetWorkbench = () => {
    workbenchForm.setFieldsValue(emptyWorkbenchQuery);
    setWorkbenchQuery(emptyWorkbenchQuery);
  };

  const searchDataScope = () => {
    const values = dataScopeForm.getFieldsValue();
    setDataScopeQuery({
      ...dataScopeQuery,
      ...values,
    });
  };

  const resetDataScope = () => {
    dataScopeForm.setFieldsValue({});
    setDataScopeQuery({});
  };

  const openDataScopeEditor = (row: PermissionDataScopePolicy) => {
    setDataScopeEditingRow(row);
    setDataScopeModeDraft(row.mode);
    dataScopeEditorForm.setFieldsValue({
      mode: row.mode,
      deptIdsText: row.deptIds.join(','),
    });
  };

  const closeDataScopeEditor = () => {
    setDataScopeEditingRow(null);
    setDataScopeModeDraft('all');
    dataScopeEditorForm.resetFields();
  };

  const saveDataScopePolicy = async () => {
    if (!dataScopeEditingRow) {
      return;
    }
    let values;
    try {
      values = await dataScopeEditorForm.validate();
    } catch (error) {
      if (isArcoFormValidationError(error)) {
        return;
      }
      throw error;
    }
    const mode = values.mode || 'all';
    const deptIds = (values.deptIdsText || '')
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item > 0);
    if (mode === 'custom' && deptIds.length === 0) {
      message.error(t('permission.data_scope.dept_required'));
      return;
    }

    setDataScopeSubmittingRoleKey(dataScopeEditingRow.roleKey);
    try {
      await updatePermissionDataScopePolicy(dataScopeEditingRow.roleKey, {
        mode,
        deptIds: mode === 'custom' ? deptIds : [],
      });
      message.success(t('common.updateSuccess'));
      publishRefresh('system:permission:changed', 'system/permission');
      await loadDataScopePolicies(dataScopeQuery, { silent: true });
    } finally {
      setDataScopeSubmittingRoleKey('');
      closeDataScopeEditor();
    }
  };

  const handleTableChange: TableProps<PermissionPolicyRow>['onChange'] = (pagination) => {
    setQuery({
      ...query,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || query.pageSize || emptyQuery.pageSize,
    });
  };

  const remediateRolePolicies = async (role: PermissionWorkbenchRole) => {
    setRemediatingRoleKey(role.roleKey);
    try {
      const result = await remediatePermissionWorkbenchRole({ roleKey: role.roleKey });
      if (result.createdCount > 0) {
        message.success(
          t('system.permission.workbench.remediateSuccess', { count: result.createdCount }),
        );
      } else {
        message.info(t('system.permission.workbench.remediateNoop'));
      }
      invalidatePermissionCaches();
      publishRefresh('system:permission:changed', 'system/permission');
      await Promise.all([
        loadWorkbench(workbenchQuery, { silent: true }),
        loadData(query, { silent: true }),
      ]);
      if (detailRole?.roleKey === role.roleKey) {
        const events = await getPermissionWorkbenchRemediationEvents({
          roleKey: role.roleKey,
          limit: 5,
        });
        setRemediationEvents(events);
      }
    } finally {
      setRemediatingRoleKey('');
    }
  };

  const translateTitleKey = (key?: string, fallback?: string) => {
    if (!key) {
      return fallback || '-';
    }
    return t(key, { defaultValue: fallback || key });
  };

  const overviewCards = useMemo(() => {
    const overview = workbench?.overview;
    return [
      {
        title: t('system.permission.workbench.roleCount'),
        value: overview?.roleCount ?? 0,
      },
      {
        title: t('system.permission.workbench.navigationAssignments'),
        value: overview?.navigationAssignmentCount ?? 0,
      },
      {
        title: t('system.permission.workbench.permissionAssignments'),
        value:
          (overview?.pagePermissionAssignmentCount ?? 0) +
          (overview?.actionPermissionAssignmentCount ?? 0),
      },
      {
        title: t('system.permission.workbench.apiAssignments'),
        value: overview?.apiActionCount ?? 0,
      },
      {
        title: t('system.permission.workbench.unknownAssignments'),
        value: overview?.unknownPermissionAssignmentCount ?? 0,
      },
      {
        title: t('system.permission.workbench.pageGapRoles'),
        value: overview?.pageGapRoleCount ?? 0,
      },
      {
        title: t('system.permission.workbench.apiGapRoles'),
        value: overview?.apiGapRoleCount ?? 0,
      },
    ];
  }, [t, workbench]);
  const heroStats = useMemo(
    () => [
      {
        key: 'roles',
        label: t('system.permission.workbench.roleCount'),
        value: workbench?.overview.roleCount ?? 0,
        hint: t('system.permission.hero.rolesHint'),
      },
      {
        key: 'assignments',
        label: t('system.permission.workbench.permissionAssignments'),
        value: workbench
          ? workbench.overview.pagePermissionAssignmentCount +
            workbench.overview.actionPermissionAssignmentCount
          : 0,
        hint: t('system.permission.hero.assignmentsHint'),
      },
      {
        key: 'api',
        label: t('system.permission.workbench.apiAssignments'),
        value: workbench?.overview.apiActionCount ?? total,
        hint: t('system.permission.hero.apiHint'),
      },
      {
        key: 'gaps',
        label: t('system.permission.hero.gaps'),
        value: workbench
          ? workbench.overview.pageGapRoleCount + workbench.overview.apiGapRoleCount
          : 0,
        hint: t('system.permission.hero.gapsHint'),
      },
    ],
    [t, total, workbench],
  );
  const governanceSummaryItems = useMemo(
    () => [
      {
        label: t('system.permission.hero.currentMode'),
        value:
          activeTab === 'workbench'
            ? t('system.permission.workbench.tab')
            : activeTab === 'data-scope'
              ? t('system.permission.dataScope.tab')
              : t('system.permission.policy.tab'),
        description: t('system.permission.hero.modeHint'),
      },
      {
        label: t('system.permission.hero.unknownAssignments'),
        value: workbench?.overview.unknownPermissionAssignmentCount ?? 0,
        description: t('system.permission.hero.unknownHint'),
      },
      {
        label: t('system.permission.hero.exportReady'),
        value: canExport ? t('common.yes') : t('common.no'),
        description: t('system.permission.hero.exportHint'),
      },
    ],
    [activeTab, canExport, t, workbench?.overview.unknownPermissionAssignmentCount],
  );

  const renderRequestErrorState = (requestError: unknown, onRetry: () => void) => {
    if (isNetworkRequestError(requestError)) {
      return <PageNetworkError timeout={isTimeoutRequestError(requestError)} onRetry={onRetry} />;
    }
    if (isServerRequestError(requestError)) {
      return <PageServerError onRetry={onRetry} />;
    }
    return <PageError onRetry={onRetry} />;
  };

  const columns: ColumnProps<PermissionPolicyRow>[] = [
    { title: t('system.permission.roleKey'), dataIndex: 'roleKey', width: 180 },
    {
      title: t('system.permission.method'),
      dataIndex: 'method',
      width: 120,
      render: (value: string) => <Tag color="arcoblue">{value}</Tag>,
    },
    { title: t('system.permission.path'), dataIndex: 'path' },
    {
      title: t('common.action'),
      width: TABLE_ACTION_COLUMN_WIDTH.compact,
      fixed: 'right',
      render: (_: unknown, row: PermissionPolicyRow) => (
        <Space size={4} className="system-list__actions">
          {canEdit ? (
            <Button type="text" size="small" icon={<IconEdit />} onClick={() => openEdit(row)}>
              {t('common.edit')}
            </Button>
          ) : null}
          {canDelete ? (
            <Popconfirm
              title={t('common.deleteConfirm')}
              onOk={() => removePolicy(row)}
              disabled={row.roleKey === 'admin'}
            >
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
                disabled={row.roleKey === 'admin'}
              >
                {t('common.delete')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  const workbenchColumns: ColumnProps<PermissionWorkbenchRole>[] = [
    { title: t('system.role.roleName'), dataIndex: 'roleName', width: 180 },
    withTableColumnPriority(
      { title: t('system.role.roleKey'), dataIndex: 'roleKey', width: 180 },
      'medium',
    ),
    withTableColumnPriority(
      {
        title: t('system.role.status'),
        dataIndex: 'status',
        width: 120,
        render: (value: number) => (
          <Tag color={value === 1 ? 'green' : 'red'}>
            {value === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}
          </Tag>
        ),
      },
      'medium',
    ),
    withTableColumnPriority(
      { title: t('system.permission.workbench.navCount'), dataIndex: 'menuCount', width: 120 },
      'low',
    ),
    withTableColumnPriority(
      {
        title: t('system.permission.workbench.pageCount'),
        dataIndex: 'pagePermissionCount',
        width: 120,
      },
      'low',
    ),
    withTableColumnPriority(
      {
        title: t('system.permission.workbench.actionCount'),
        dataIndex: 'actionPermissionCount',
        width: 120,
      },
      'low',
    ),
    withTableColumnPriority(
      { title: t('system.permission.workbench.apiCount'), dataIndex: 'apiPolicyCount', width: 120 },
      'low',
    ),
    {
      title: t('system.permission.workbench.coverage'),
      dataIndex: 'coverage',
      width: 220,
      render: (_: unknown, row: PermissionWorkbenchRole) => (
        <Space size={4} wrap>
          {row.hasPageGap ? (
            <Tag color="orange">{t('system.permission.workbench.coverage.pageGap')}</Tag>
          ) : null}
          {row.hasApiGap ? (
            <Tag color="red">{t('system.permission.workbench.coverage.apiGap')}</Tag>
          ) : null}
          {!row.hasPageGap && !row.hasApiGap ? (
            <Tag color="green">{t('system.permission.workbench.coverage.complete')}</Tag>
          ) : null}
        </Space>
      ),
    },
    withTableColumnPriority(
      {
        title: t('system.permission.workbench.unknownCount'),
        dataIndex: 'unknownPermissionCount',
        width: 140,
        render: (value: number) =>
          value > 0 ? <Tag color="orange">{value}</Tag> : <Tag color="green">0</Tag>,
      },
      'medium',
    ),
    {
      title: t('common.action'),
      width: TABLE_ACTION_COLUMN_WIDTH.single,
      fixed: 'right',
      render: (_: unknown, row: PermissionWorkbenchRole) => (
        <Button type="text" size="small" onClick={() => setDetailRole(row)}>
          {t('common.detail')}
        </Button>
      ),
    },
  ];

  const dataScopeColumns: ColumnProps<PermissionDataScopePolicy>[] = [
    { title: t('system.role.roleName'), dataIndex: 'roleName', width: 180 },
    withTableColumnPriority(
      { title: t('system.role.roleKey'), dataIndex: 'roleKey', width: 180 },
      'medium',
    ),
    withTableColumnPriority(
      {
        title: t('system.role.status'),
        dataIndex: 'status',
        width: 120,
        render: (value: number) => (
          <Tag color={value === 1 ? 'green' : 'red'}>
            {value === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}
          </Tag>
        ),
      },
      'medium',
    ),
    {
      title: t('system.permission.dataScope.mode'),
      dataIndex: 'mode',
      width: 220,
      render: (value: PermissionDataScopeMode) => (
        <Tag color="arcoblue">
          {t(
            `system.permission.dataScope.mode.${value === 'dept_and_children' ? 'deptAndChildren' : value}`,
          )}
        </Tag>
      ),
    },
    {
      title: t('system.permission.dataScope.customDeptIds'),
      dataIndex: 'deptIds',
      width: 280,
      render: (_: unknown, row: PermissionDataScopePolicy) => (
        <Space wrap>
          {row.deptIds.length > 0 ? (
            row.deptIds.map((deptId) => <Tag key={`${row.roleKey}-${deptId}`}>{deptId}</Tag>)
          ) : (
            <Typography.Text type="secondary">{t('common.noData')}</Typography.Text>
          )}
        </Space>
      ),
    },
    withTableColumnPriority(
      {
        title: t('system.permission.dataScope.policyState'),
        dataIndex: 'policyExists',
        width: 140,
        render: (value: boolean) => (
          <Tag color={value ? 'green' : 'gray'}>
            {t(
              value
                ? 'system.permission.dataScope.explicit'
                : 'system.permission.dataScope.default',
            )}
          </Tag>
        ),
      },
      'low',
    ),
    {
      title: t('common.action'),
      width: TABLE_ACTION_COLUMN_WIDTH.single,
      fixed: 'right',
      render: (_: unknown, row: PermissionDataScopePolicy) => (
        <Button
          type="text"
          size="small"
          icon={<IconEdit />}
          disabled={!canEdit}
          onClick={() => openDataScopeEditor(row)}
        >
          {t('common.edit')}
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t('system.menu.permission')}
        extra={
          <ListHeaderActions
            utility={
              <>
                <GovernanceRailToggleButton
                  expanded={governanceRail.expanded}
                  onToggle={governanceRail.toggle}
                >
                  {t('system.permission.hero.summaryTitle')}
                </GovernanceRailToggleButton>
                <Button
                  icon={<IconRefresh />}
                  onClick={() => {
                    if (activeTab === 'workbench') {
                      void loadWorkbench(workbenchQuery);
                      return;
                    }
                    if (activeTab === 'data-scope') {
                      void loadDataScopePolicies(dataScopeQuery);
                      return;
                    }
                    void loadData(query);
                  }}
                >
                  {t('common.refresh')}
                </Button>
                {activeTab === 'workbench' ? (
                  <Button
                    icon={<IconDownload />}
                    onClick={() => {
                      void exportPermissionWorkbench(workbenchQuery);
                    }}
                    disabled={!canExport}
                  >
                    {t('system.permission.workbench.export')}
                  </Button>
                ) : null}
                {activeTab === 'api' ? (
                  <>
                    <Button
                      icon={<IconDownload />}
                      onClick={() => {
                        void handleExport();
                      }}
                      disabled={!canExport}
                    >
                      {t('common.export')}
                    </Button>
                    <Button
                      onClick={() => {
                        void handleDownloadTemplate();
                      }}
                      disabled={!canImport}
                    >
                      {t('common.downloadTemplate')}
                    </Button>
                    <ImportCsvButton
                      disabled={!canImport}
                      onSelect={(file) => {
                        void handleImport(file);
                      }}
                    >
                      {t('common.import')}
                    </ImportCsvButton>
                  </>
                ) : null}
              </>
            }
            primary={
              activeTab === 'api' ? (
                <Button
                  type="primary"
                  icon={<IconPlus />}
                  onClick={openCreate}
                  disabled={!canCreate}
                >
                  {t('common.add')}
                </Button>
              ) : null
            }
          />
        }
      />

      <Space direction="vertical" size={16} className="system-page-template">
        <Card className="page-panel system-page-hero system-list__hero">
          <div className="system-page-hero__top">
            <div className="system-page-hero__copy">
              <span className="system-page-hero__eyebrow">
                {t('system.permission.hero.eyebrow')}
              </span>
              <Typography.Title heading={5} className="system-page-hero__title">
                {t('system.permission.hero.title')}
              </Typography.Title>
            </div>
          </div>
          <div className="system-page-kpi-grid">
            {heroStats.map((item) => (
              <div key={item.key} className="system-page-kpi">
                <span className="system-page-kpi__label">{item.label}</span>
                <span className="system-page-kpi__value">{item.value}</span>
                <span className="system-page-kpi__hint">{item.hint}</span>
              </div>
            ))}
          </div>
        </Card>
        <PageSplitLayout
          rail={
            governanceRail.expanded ? (
              <GovernanceRailPanel
                title={t('system.permission.hero.summaryTitle')}
                onClose={governanceRail.close}
                closeText={t('common.close')}
                noteTitle={t('system.permission.hero.summaryTitle')}
                noteDescription={t('system.permission.hero.sideDesc')}
              >
                <GovernanceRailSummary items={governanceSummaryItems} />
              </GovernanceRailPanel>
            ) : null
          }
        >
          <Card className="page-panel permission-workbench__tabs">
            <Tabs
              activeTab={activeTab}
              onChange={(value) => setActiveTab(value as PermissionTabKey)}
            >
              <Tabs.TabPane key="workbench" title={t('system.permission.workbench.tab')} />
              <Tabs.TabPane key="data-scope" title={t('system.permission.dataScope.tab')} />
              <Tabs.TabPane key="api" title={t('system.permission.policy.tab')} />
            </Tabs>
          </Card>

          {activeTab === 'workbench' ? (
            <Space direction="vertical" size={14} className="permission-workbench">
              {workbench ? (
                <Row gutter={[12, 12]} className="permission-workbench__overview">
                  {overviewCards.map((item) => (
                    <Col xs={24} sm={12} lg={6} key={item.title}>
                      <Card className="page-stat-panel permission-workbench__overview-card">
                        <Typography.Text type="secondary">{item.title}</Typography.Text>
                        <Typography.Title heading={4} style={{ margin: '8px 0 0' }}>
                          {item.value}
                        </Typography.Title>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : null}

              <FilterPanel>
                <Form form={workbenchForm} layout="vertical" onSubmit={() => searchWorkbench()}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <FormItem label={t('system.permission.roleKey')} field="roleKey">
                        <Select allowClear options={roleOptions} />
                      </FormItem>
                    </Col>
                    <Col span={6}>
                      <FormItem label={t('system.role.status')} field="status">
                        <Select
                          allowClear
                          options={[
                            { label: t('system.user.status.enabled'), value: 1 },
                            { label: t('system.user.status.disabled'), value: 2 },
                          ]}
                        />
                      </FormItem>
                    </Col>
                    <Col span={6}>
                      <FormItem
                        label={t('system.permission.workbench.integrity')}
                        field="integrity"
                      >
                        <Select
                          allowClear
                          options={[
                            {
                              label: t('system.permission.workbench.integrity.unknown'),
                              value: 'unknown',
                            },
                            {
                              label: t('system.permission.workbench.integrity.clean'),
                              value: 'clean',
                            },
                          ]}
                        />
                      </FormItem>
                    </Col>
                    <Col span={6}>
                      <FormItem label={t('system.permission.workbench.coverage')} field="coverage">
                        <Select
                          allowClear
                          options={[
                            {
                              label: t('system.permission.workbench.coverage.pageGap'),
                              value: 'page-gap',
                            },
                            {
                              label: t('system.permission.workbench.coverage.apiGap'),
                              value: 'api-gap',
                            },
                            {
                              label: t('system.permission.workbench.coverage.complete'),
                              value: 'complete',
                            },
                          ]}
                        />
                      </FormItem>
                    </Col>
                    <Col span={4}>
                      <FormItem className="filter-panel__action-item">
                        <Space>
                          <Button type="primary" htmlType="submit" icon={<IconSearch />}>
                            {t('common.search')}
                          </Button>
                          <Button onClick={resetWorkbench}>{t('common.reset')}</Button>
                        </Space>
                      </FormItem>
                    </Col>
                  </Row>
                </Form>
              </FilterPanel>

              <Card className="page-panel system-list__table-card">
                {workbenchLoading && !workbench ? <PageLoading /> : null}
                {workbenchError && !workbench
                  ? renderRequestErrorState(workbenchError, () => {
                      void loadWorkbench(workbenchQuery);
                    })
                  : null}
                {!workbenchLoading &&
                !workbenchError &&
                (!workbench || workbench.roles.length === 0) ? (
                  <PageEmpty description={t('common.noData')} />
                ) : null}
                {!workbenchLoading &&
                !(workbenchError && !workbench) &&
                workbench &&
                workbench.roles.length > 0 ? (
                  <AppTable<PermissionWorkbenchRole>
                    className="system-list__table"
                    rowKey="id"
                    data={workbench.roles}
                    columns={workbenchColumns}
                    loading={workbenchLoading}
                    scroll={{ x: 'max-content' }}
                    pagination={false}
                    emptyText={t('common.noData')}
                  />
                ) : null}
              </Card>
            </Space>
          ) : activeTab === 'data-scope' ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <FilterPanel>
                <Form form={dataScopeForm} layout="vertical" onSubmit={() => searchDataScope()}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <FormItem label={t('system.permission.roleKey')} field="roleKey">
                        <Select allowClear options={roleOptions} />
                      </FormItem>
                    </Col>
                    <Col span={6}>
                      <FormItem label={t('system.role.status')} field="status">
                        <Select
                          allowClear
                          options={[
                            { label: t('system.user.status.enabled'), value: 1 },
                            { label: t('system.user.status.disabled'), value: 2 },
                          ]}
                        />
                      </FormItem>
                    </Col>
                    <Col span={6}>
                      <FormItem className="filter-panel__action-item">
                        <Space>
                          <Button type="primary" htmlType="submit" icon={<IconSearch />}>
                            {t('common.search')}
                          </Button>
                          <Button onClick={resetDataScope}>{t('common.reset')}</Button>
                        </Space>
                      </FormItem>
                    </Col>
                  </Row>
                </Form>
              </FilterPanel>
              <Card className="page-panel system-list__table-card">
                {dataScopeLoading && dataScopeRows.length === 0 ? <PageLoading /> : null}
                {dataScopeError && dataScopeRows.length === 0
                  ? renderRequestErrorState(dataScopeError, () => {
                      void loadDataScopePolicies(dataScopeQuery);
                    })
                  : null}
                {!dataScopeLoading && !dataScopeError && dataScopeRows.length === 0 ? (
                  <PageEmpty description={t('common.noData')} />
                ) : null}
                {!(dataScopeError && dataScopeRows.length === 0) && dataScopeRows.length > 0 ? (
                  <AppTable<PermissionDataScopePolicy>
                    className="system-list__table"
                    rowKey="roleKey"
                    data={dataScopeRows}
                    columns={dataScopeColumns}
                    loading={dataScopeLoading}
                    scroll={{ x: 'max-content' }}
                    pagination={false}
                    emptyText={t('common.noData')}
                  />
                ) : null}
              </Card>
            </Space>
          ) : (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <FilterPanel>
                <Form form={queryForm} layout="vertical" onSubmit={() => search()}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <FormItem label={t('system.permission.roleKey')} field="roleKey">
                        <Select allowClear options={roleOptions} />
                      </FormItem>
                    </Col>
                    <Col span={8}>
                      <FormItem label={t('system.permission.path')} field="path">
                        <Input onPressEnter={() => queryForm.submit()} />
                      </FormItem>
                    </Col>
                    <Col span={4}>
                      <FormItem label={t('system.permission.method')} field="method">
                        <Select
                          allowClear
                          options={methodOptions.map((item) => ({ label: item, value: item }))}
                        />
                      </FormItem>
                    </Col>
                    <Col span={4}>
                      <FormItem className="filter-panel__action-item">
                        <Space>
                          <Button type="primary" htmlType="submit" icon={<IconSearch />}>
                            {t('common.search')}
                          </Button>
                          <Button onClick={reset}>{t('common.reset')}</Button>
                        </Space>
                      </FormItem>
                    </Col>
                  </Row>
                </Form>
              </FilterPanel>
              <Card className="page-panel system-list__table-card">
                {loading && data.length === 0 ? <PageLoading /> : null}
                {policyError && data.length === 0
                  ? renderRequestErrorState(policyError, () => {
                      void loadData(query);
                    })
                  : null}
                {!loading && !policyError && data.length === 0 ? (
                  <PageEmpty description={t('common.noData')} />
                ) : null}
                {!loading && !(policyError && data.length === 0) && data.length > 0 ? (
                  <AppTable<PermissionPolicyRow>
                    className="system-list__table"
                    data={data}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 'max-content' }}
                    onChange={handleTableChange}
                    emptyText={t('common.noData')}
                    pagination={
                      {
                        current: query.page || emptyQuery.page,
                        pageSize: query.pageSize || emptyQuery.pageSize,
                        total,
                        showJumper: true,
                        pageSizeChangeResetCurrent: false,
                        sizeCanChange: true,
                        sizeOptions: [10, 20, 50, 100],
                        size: 'small',
                        showTotal: (count: number) => t('common.total', { count }),
                      } as PaginationProps
                    }
                  />
                ) : null}
              </Card>
            </Space>
          )}
        </PageSplitLayout>
      </Space>

      <AppModal
        title={
          dataScopeEditingRow
            ? `${dataScopeEditingRow.roleName} · ${dataScopeEditingRow.roleKey}`
            : t('system.permission.dataScope.tab')
        }
        visible={Boolean(dataScopeEditingRow)}
        size="md"
        confirmLoading={dataScopeSubmittingRoleKey === dataScopeEditingRow?.roleKey}
        onOk={() => {
          void saveDataScopePolicy();
        }}
        onCancel={closeDataScopeEditor}
      >
        <Form form={dataScopeEditorForm} layout="vertical">
          <FormItem label={t('system.permission.dataScope.mode')} field="mode">
            <Select
              value={dataScopeModeDraft}
              options={[
                { label: t('system.permission.dataScope.mode.all'), value: 'all' },
                { label: t('system.permission.dataScope.mode.self'), value: 'self' },
                { label: t('system.permission.dataScope.mode.dept'), value: 'dept' },
                {
                  label: t('system.permission.dataScope.mode.deptAndChildren'),
                  value: 'dept_and_children',
                },
                { label: t('system.permission.dataScope.mode.custom'), value: 'custom' },
              ]}
              onChange={(value) => {
                const nextMode = (value as PermissionDataScopeMode) || 'all';
                setDataScopeModeDraft(nextMode);
                dataScopeEditorForm.setFieldValue('mode', nextMode);
              }}
            />
          </FormItem>
          <FormItem
            label={t('system.permission.dataScope.customDeptIds')}
            field="deptIdsText"
            extra={t('system.permission.dataScope.customDeptIds.placeholder')}
          >
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              disabled={dataScopeModeDraft !== 'custom'}
              placeholder={t('system.permission.dataScope.customDeptIds.placeholder')}
            />
          </FormItem>
        </Form>
      </AppModal>

      <AppModal
        title={
          detailRole
            ? `${detailRole.roleName} · ${detailRole.roleKey}`
            : t('system.permission.workbench.detailTitle')
        }
        visible={Boolean(detailRole)}
        size="detail"
        onCancel={() => setDetailRole(null)}
        footer={null}
      >
        {detailRole ? (
          <Space direction="vertical" size={16} className="detail-stack">
            <Descriptions
              column={4}
              data={[
                { label: t('system.permission.workbench.navCount'), value: detailRole.menuCount },
                {
                  label: t('system.permission.workbench.pageCount'),
                  value: detailRole.pagePermissionCount,
                },
                {
                  label: t('system.permission.workbench.actionCount'),
                  value: detailRole.actionPermissionCount,
                },
                {
                  label: t('system.permission.workbench.apiCount'),
                  value: detailRole.apiPolicyCount,
                },
                {
                  label: t('system.permission.workbench.apiRequiredCount'),
                  value: detailRole.requiredApiPolicyCount,
                },
                {
                  label: t('system.permission.workbench.apiMissingCount'),
                  value: detailRole.missingApiPolicyCount,
                },
                {
                  label: t('system.permission.workbench.coverage'),
                  value:
                    [
                      detailRole.hasPageGap
                        ? t('system.permission.workbench.coverage.pageGap')
                        : '',
                      detailRole.hasApiGap ? t('system.permission.workbench.coverage.apiGap') : '',
                    ]
                      .filter(Boolean)
                      .join(' / ') || t('system.permission.workbench.coverage.complete'),
                },
              ]}
            />

            <Card className="detail-panel-card" title={t('system.permission.workbench.navSection')}>
              <Space wrap>
                {detailRole.menus.length > 0 ? (
                  detailRole.menus.map((item) => (
                    <Tag key={`${item.id}-${item.path}`}>
                      {translateTitleKey(item.titleKey, item.path)}
                    </Tag>
                  ))
                ) : (
                  <Typography.Text type="secondary">{t('common.noData')}</Typography.Text>
                )}
              </Space>
            </Card>

            <Card
              className="detail-panel-card"
              title={t('system.permission.workbench.pageSection')}
            >
              <Space wrap>
                {detailRole.pagePermissions.length > 0 ? (
                  detailRole.pagePermissions.map((item) => (
                    <Tag key={item.key} color="arcoblue">
                      {translateTitleKey(item.titleKey, item.key)}
                    </Tag>
                  ))
                ) : (
                  <Typography.Text type="secondary">{t('common.noData')}</Typography.Text>
                )}
              </Space>
            </Card>

            <Card
              className="detail-panel-card"
              title={t('system.permission.workbench.actionSection')}
            >
              <Space wrap>
                {detailRole.actionPermissions.length > 0 ? (
                  detailRole.actionPermissions.map((item) => (
                    <Tag key={item.key} color="green">
                      {translateTitleKey(item.titleKey, item.key)}
                    </Tag>
                  ))
                ) : (
                  <Typography.Text type="secondary">{t('common.noData')}</Typography.Text>
                )}
              </Space>
            </Card>

            <Card className="detail-panel-card" title={t('system.permission.workbench.apiSection')}>
              <AppTable
                rowKey="id"
                data={detailRole.apiPolicies}
                columns={[
                  {
                    title: t('system.permission.method'),
                    dataIndex: 'method',
                    render: (value: string) => <Tag color="arcoblue">{value}</Tag>,
                  },
                  {
                    title: t('system.permission.path'),
                    dataIndex: 'path',
                  },
                ]}
                pagination={false}
                emptyText={t('common.noData')}
              />
            </Card>

            {detailRole.missingApiPolicies.length > 0 ? (
              <Card
                className="detail-panel-card"
                title={t('system.permission.workbench.missingApiSection')}
                extra={
                  canCreate ? (
                    <Button
                      type="primary"
                      size="small"
                      loading={remediatingRoleKey === detailRole.roleKey}
                      onClick={() => {
                        void remediateRolePolicies(detailRole);
                      }}
                    >
                      {t('system.permission.workbench.remediateAction')}
                    </Button>
                  ) : null
                }
              >
                <AppTable
                  rowKey={(record) => `${record.method}-${record.path}`}
                  data={detailRole.missingApiPolicies}
                  columns={[
                    {
                      title: t('system.permission.method'),
                      dataIndex: 'method',
                      render: (value: string) => <Tag color="red">{value}</Tag>,
                    },
                    {
                      title: t('system.permission.path'),
                      dataIndex: 'path',
                    },
                  ]}
                  pagination={false}
                  emptyText={t('common.noData')}
                />
              </Card>
            ) : null}

            <Card
              className="detail-panel-card"
              title={t('system.permission.workbench.remediationSection')}
            >
              <AppTable<PermissionWorkbenchRemediationEvent>
                rowKey="id"
                data={remediationEvents}
                columns={[
                  {
                    title: t('system.permission.workbench.remediationAction'),
                    dataIndex: 'action',
                    render: (value: string) => (
                      <Tag color={value === 'remediated' ? 'green' : 'arcoblue'}>{value}</Tag>
                    ),
                  },
                  {
                    title: t('system.permission.workbench.remediationState'),
                    render: (_: unknown, row: PermissionWorkbenchRemediationEvent) =>
                      `${row.beforeState} -> ${row.afterState}`,
                  },
                  {
                    title: t('system.permission.workbench.remediationCreated'),
                    dataIndex: 'createdCount',
                  },
                  {
                    title: t('system.permission.workbench.remediationSkipped'),
                    dataIndex: 'skippedCount',
                  },
                  {
                    title: t('system.permission.workbench.remediationTime'),
                    dataIndex: 'createdAt',
                  },
                ]}
                pagination={false}
                emptyText={t('common.noData')}
              />
            </Card>

            {detailRole.unknownPermissions.length > 0 ? (
              <Card
                className="detail-panel-card"
                title={t('system.permission.workbench.unknownSection')}
              >
                <Space wrap>
                  {detailRole.unknownPermissions.map((item) => (
                    <Tag key={item.key} color="orange">
                      {item.key}
                    </Tag>
                  ))}
                </Space>
              </Card>
            ) : null}
          </Space>
        ) : null}
      </AppModal>

      <AppModal
        title={editing ? t('system.permission.edit') : t('system.permission.create')}
        visible={visible}
        size="md"
        onCancel={() => setVisible(false)}
        footer={
          <SubmitBar
            onCancel={() => setVisible(false)}
            onSubmit={() => {
              void submitForm();
            }}
            loading={submitting}
            submitText={editing ? t('common.save') : t('common.add')}
          />
        }
        unmountOnExit
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={() => {
            void submitForm();
          }}
        >
          <Space direction="vertical" size={20} className="dialog-form-stack">
            <FormSection title={t('common.basicInfo')}>
              <FormItem
                label={t('system.permission.roleKey')}
                field="roleKey"
                rules={[{ required: true, message: t('system.permission.roleRequired') }]}
              >
                <Select options={roleOptions} />
              </FormItem>
              <FormItem
                label={t('system.permission.path')}
                field="path"
                rules={[{ required: true, message: t('system.permission.pathRequired') }]}
              >
                <Input placeholder="/api/v1/system/user/list" onPressEnter={() => form.submit()} />
              </FormItem>
              <FormItem
                label={t('system.permission.method')}
                field="method"
                rules={[{ required: true, message: t('system.permission.methodRequired') }]}
              >
                <Select options={methodOptions.map((item) => ({ label: item, value: item }))} />
              </FormItem>
            </FormSection>
          </Space>
        </Form>
      </AppModal>
    </PageContainer>
  );
};

export default PermissionList;
