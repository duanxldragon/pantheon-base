import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Grid,
  Input,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
import dayjs from 'dayjs';
import { IconCalendar, IconDelete, IconDownload, IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { message } from '../../../../components/feedback/message';
import type { ColumnProps, TableProps } from '@arco-design/web-react/es/Table/interface';
import { getSettingGroup, type SettingGroup } from '../../../system/setting/api';
import {
  getVisibleSelectedRowKeys,
  mergeCrossPageSelection,
} from '../../../../components/table/crossPageSelection';
import { formatDateTime } from '../../../../core/format/dateTime';
import {
  batchDeleteAdminLoginLogs,
  cleanupAdminLoginLogs,
  exportAdminLoginLogs,
  exportSelectedAdminLoginLogs,
  getAdminLoginLogList,
  type LoginLogPageResp,
  type LoginLogQuery,
  type LoginLogRow,
} from '../api';
import { renderClientInfo } from '../../session/clientInfo';
import {
  AppTable,
  buildStandardPagination,
  FilterPanel,
  type GovernanceCleanupMode,
  GovernanceCleanupBar,
  GovernanceInsightDrawer,
  GovernanceRailSummary,
  GovernanceRailToggleButton,
  GovernanceSummaryBar,
  PageContainer,
  PageEmpty,
  PageLoading,
  PageRequestError,
  PermissionAction,
  TABLE_COLUMN_WIDTH,
  useGovernanceRail,
} from '../../../../components';
import { usePermission } from '../../../../hooks/usePermission';
import '../../../system/components/shared/list-page.css';
import '../../auth.css';
import {
  loadRetentionSetting,
  toCleanupTimestampFromParts,
} from '../../../system/audit/retentionSetting';
const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const RangePicker = DatePicker.RangePicker;
const defaultRetentionOptions = [1, 7, 30];

const emptyQuery: LoginLogQuery = {
  username: '',
  status: undefined,
  startedAt: '',
  endedAt: '',
  page: 1,
  pageSize: 10,
};

const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';

// Quick time presets - 更新为更细粒度的时间选项
type TimePreset = {
  label: string;
  minutes?: number;
  hours?: number;
  preset?: 'today' | 'yesterday';
};

const TIME_PRESETS: readonly TimePreset[] = [
  { label: '5分钟', minutes: 5 },
  { label: '30分钟', minutes: 30 },
  { label: '1小时', hours: 1 },
  { label: '3小时', hours: 3 },
  { label: '12小时', hours: 12 },
  { label: '24小时', hours: 24 },
  { label: '2天', hours: 48 },
  { label: '7天', hours: 24 * 7 },
  { label: '30天', hours: 24 * 30 },
  { label: '今天', preset: 'today' },
  { label: '昨天', preset: 'yesterday' },
] as const;

const LOGIN_LOG_DURATION_PRESETS = TIME_PRESETS.filter((preset) => !preset.preset);
const LOGIN_LOG_CALENDAR_PRESETS = TIME_PRESETS.filter((preset) => preset.preset);

function buildTimePresetRange(preset: TimePreset): [dayjs.Dayjs, dayjs.Dayjs] {
  const now = dayjs();

  if (preset.preset === 'today') {
    return [now.startOf('day'), now.endOf('day')];
  }

  if (preset.preset === 'yesterday') {
    const yesterday = now.subtract(1, 'day');
    return [yesterday.startOf('day'), yesterday.endOf('day')];
  }

  if (preset.minutes) {
    return [now.subtract(preset.minutes, 'minute').startOf('minute'), now.endOf('minute')];
  }

  return [now.subtract(preset.hours || 0, 'hour').startOf('minute'), now.endOf('minute')];
}

function getDefaultTimeRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  return [dayjs().subtract(24, 'hour').startOf('minute'), dayjs().endOf('minute')];
}

function formatTimeRangeRange([start, end]: [dayjs.Dayjs, dayjs.Dayjs]) {
  return [start.format(DATETIME_FORMAT), end.format(DATETIME_FORMAT)] as const;
}

const LOGIN_LOG_RANGE_PICKER_TRIGGER_PROPS = {
  className: 'auth-login-log-page__time-range-popup',
  autoAlignPopupWidth: false,
  popupAlign: { bottom: 6 },
  popupStyle: {
    width: 'min(600px, calc(100vw - 32px))',
    maxHeight: 560,
  },
} as const;

const DEFAULT_TIME_RANGE_LABEL = '24小时';

const LoginLogList: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, hasPerm } = usePermission();
  const canExport = isAdmin || hasPerm('system:login-log:export');
  const canClear = isAdmin || hasPerm('system:login-log:clear');
  const canDelete = isAdmin || hasPerm('system:login-log:delete');
  const governanceRail = useGovernanceRail();
  const [data, setData] = useState<LoginLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [query, setQuery] = useState<LoginLogQuery>(emptyQuery);
  const [queryForm] = Form.useForm<LoginLogQuery>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [cleanupMode, setCleanupMode] = useState<GovernanceCleanupMode>('retention');
  const [cleanupRangeStartDate, setCleanupRangeStartDate] = useState('');
  const [cleanupRangeStartTime, setCleanupRangeStartTime] = useState('');
  const [cleanupRangeEndDate, setCleanupRangeEndDate] = useState('');
  const [cleanupRangeEndTime, setCleanupRangeEndTime] = useState('');
  const [retentionOptions, setRetentionOptions] = useState<number[]>(() =>
    [...defaultRetentionOptions].sort((left, right) => right - left),
  );

  const [timeRangePopupVisible, setTimeRangePopupVisible] = useState(false);
  const [timeRangeDraft, setTimeRangeDraft] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [quickSelectPreset, setQuickSelectPreset] = useState<string>(DEFAULT_TIME_RANGE_LABEL);

  const timeRangeValue = useMemo<[dayjs.Dayjs, dayjs.Dayjs]>(() => {
    if (query.startedAt && query.endedAt) {
      const start = dayjs(query.startedAt);
      const end = dayjs(query.endedAt);
      if (start.isValid() && end.isValid()) {
        return [start, end];
      }
    }
    return getDefaultTimeRange();
  }, [query.endedAt, query.startedAt]);

  const timeRangeDisplayValue = timeRangeDraft ?? timeRangeValue;

  const closeTimeRangePopup = useCallback(() => {
    setTimeRangePopupVisible(false);
    setTimeRangeDraft(null);
  }, []);

  const handleTimeRangeShortcutApply = useCallback(
    (preset: TimePreset) => {
      const [startedAt, endedAt] = buildTimePresetRange(preset);

      setSelectedRowKeys([]);
      setQuickSelectPreset(preset.label);
      setQuery((prev) => ({
        ...prev,
        startedAt: startedAt.format(DATETIME_FORMAT),
        endedAt: endedAt.format(DATETIME_FORMAT),
        page: 1,
      }));
      closeTimeRangePopup();
    },
    [closeTimeRangePopup],
  );

  const handleTimeRangePopupVisibleChange = useCallback(
    (visible?: boolean) => {
      const nextVisible = Boolean(visible);
      setTimeRangePopupVisible(nextVisible);
      setTimeRangeDraft(nextVisible ? timeRangeValue : null);
    },
    [timeRangeValue],
  );

  const handleTimeRangeSelect = useCallback(
    (_dateStrings: string[], dateValues: dayjs.Dayjs[]) => {
      if (!dateValues || dateValues.length < 2) {
        return;
      }

      const nextStart = dateValues[0] ? dateValues[0].startOf('minute') : timeRangeValue[0];
      const nextEnd = dateValues[1] ? dateValues[1].endOf('minute') : timeRangeValue[1];

      setTimeRangeDraft([nextStart, nextEnd]);
      setQuickSelectPreset('自定义');
    },
    [timeRangeValue],
  );

  const loadData = useCallback(
    async (nextQuery: LoginLogQuery = query) => {
      setLoading(true);
      setLoadError(null);
      try {
        const result: LoginLogPageResp = await getAdminLoginLogList(nextQuery);
        setData(result.items);
        setTotal(result.total);
      } catch (requestError) {
        setLoadError(requestError);
        message.error(t('common.loadFailed'));
      } finally {
        setLoading(false);
      }
    },
    [query, t],
  );

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void loadData(query);
    }, 0);
    return () => globalThis.clearTimeout(timer);
  }, [loadData, query]);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      getSettingGroup('audit')
        .then((group: SettingGroup) =>
          loadRetentionSetting(
            group,
            'audit.login_log_retention_options',
            setRetentionOptions,
            setRetentionDays,
          ),
        )
        .catch(() => undefined);
    }, 0);
    return () => globalThis.clearTimeout(timer);
  }, []);

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
    queryForm.setFieldsValue({ username: '', status: undefined });
    setSelectedRowKeys([]);
    setTimeRangePopupVisible(false);
    setTimeRangeDraft(null);
    setQuickSelectPreset(DEFAULT_TIME_RANGE_LABEL);
    const [defaultStart, defaultEnd] = getDefaultTimeRange();
    setQuery({
      ...emptyQuery,
      startedAt: defaultStart.format(DATETIME_FORMAT),
      endedAt: defaultEnd.format(DATETIME_FORMAT),
    });
  };

  const handleTimeRangeChange = useCallback(
    (_dateStrings: string[], dateValues: dayjs.Dayjs[]) => {
      if (!dateValues || dateValues.length < 2 || !dateValues[0] || !dateValues[1]) {
        return;
      }

      setSelectedRowKeys([]);
      setQuery((prev) => ({
        ...prev,
        startedAt: dateValues[0].startOf('minute').format(DATETIME_FORMAT),
        endedAt: dateValues[1].endOf('minute').format(DATETIME_FORMAT),
        page: 1,
      }));
      setTimeRangeDraft(null);
      setQuickSelectPreset('自定义');
    },
    [],
  );

  const handleTableChange: TableProps<LoginLogRow>['onChange'] = (pagination) => {
    setQuery({
      ...query,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || query.pageSize || emptyQuery.pageSize,
    });
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t('common.batchSelectionRequired'));
      return;
    }
    try {
      const resp = await batchDeleteAdminLoginLogs({ ids: selectedRowKeys });
      message.success(t('auth.loginLog.batchDeleteSuccess', { count: resp.deletedCount }));
      setSelectedRowKeys([]);
      void loadData();
    } catch {
      message.error(t('common.actionFailed'));
    }
  };

  const handleCleanup = async () => {
    try {
      if (cleanupMode === 'range') {
        const startedAt = toCleanupTimestampFromParts(
          cleanupRangeStartDate,
          cleanupRangeStartTime,
        );
        const endedAt = toCleanupTimestampFromParts(cleanupRangeEndDate, cleanupRangeEndTime);
        if (!startedAt || !endedAt) {
          message.warning(t('common.cleanupRangeRequired'));
          return;
        }
        const resp = await cleanupAdminLoginLogs({
          startedAt,
          endedAt,
        });
        message.success(t('auth.loginLog.cleanupSuccess', { count: resp.clearedCount }));
        void loadData();
        return;
      }

      const resp = await cleanupAdminLoginLogs({ retentionDays });
      message.success(t('auth.loginLog.cleanupSuccess', { count: resp.clearedCount }));
      void loadData();
    } catch {
      message.error(t('common.actionFailed'));
    }
  };

  const translateLogMessage = (value?: string | null) => {
    if (!value) {
      return '-';
    }
    return t(value, { defaultValue: value });
  };

  const successCount = data.filter((item) => item.status === 1).length;
  const failedCount = data.filter((item) => item.status !== 1).length;
  const visibleSelectedRowKeys = useMemo(
    () =>
      getVisibleSelectedRowKeys(
        selectedRowKeys,
        data.map((item) => item.id),
      ),
    [data, selectedRowKeys],
  );
  const heroStats = useMemo(
    () => [
      {
        key: 'total',
        label: t('auth.security.loginLogs'),
        value: total,
        hint: t('auth.loginLog.hero.totalHint'),
      },
      {
        key: 'success',
        label: t('auth.loginLog.status.success'),
        value: successCount,
        hint: t('auth.loginLog.hero.successHint'),
      },
      {
        key: 'failed',
        label: t('auth.loginLog.status.failed'),
        value: failedCount,
        hint: t('auth.loginLog.hero.failedHint'),
      },
    ],
    [failedCount, successCount, t, total],
  );

  const columns: ColumnProps<LoginLogRow>[] = [
    {
      title: t('system.user.username'),
      dataIndex: 'username',
      width: TABLE_COLUMN_WIDTH.identity,
    },
    { title: t('auth.loginLog.ip'), dataIndex: 'ipaddr', width: TABLE_COLUMN_WIDTH.identity },
    {
      title: t('auth.loginLog.location'),
      dataIndex: 'loginLocation',
      width: TABLE_COLUMN_WIDTH.location,
      ellipsis: true,
      // Backend stores a stable i18n key (location.*); legacy rows keep raw text,
      // which passes through via defaultValue.
      render: (value: string) => (value ? t(value, { defaultValue: value }) : '-'),
    },
    {
      title: t('auth.loginLog.browser'),
      dataIndex: 'browser',
      width: TABLE_COLUMN_WIDTH.diagnostics,
      render: (_: unknown, record: LoginLogRow) => renderClientInfo(record),
    },
    {
      title: t('auth.loginLog.status'),
      dataIndex: 'status',
      width: TABLE_COLUMN_WIDTH.status,
      render: (value: number) =>
        value === 1 ? (
          <Tag color="green">{t('auth.loginLog.status.success')}</Tag>
        ) : (
          <Tag color="red">{t('auth.loginLog.status.failed')}</Tag>
        ),
    },
    {
      title: t('auth.loginLog.failureReason'),
      dataIndex: 'msg',
      width: TABLE_COLUMN_WIDTH.diagnostics,
      ellipsis: true,
      render: (value: string) => translateLogMessage(value),
    },
    {
      title: t('auth.loginLog.loginTime'),
      dataIndex: 'loginTime',
      width: TABLE_COLUMN_WIDTH.datetime,
      render: (value: string) => formatDateTime(value, { withSeconds: true }),
    },
  ];

  const handleExport = async () => {
    if (selectedRowKeys.length > 0) {
      const selectedRows = data.filter((item) => selectedRowKeys.includes(item.id));
      if (selectedRows.length !== selectedRowKeys.length) {
        message.warning(
          t('common.exportCurrentPageSelectionOnly', {
            defaultValue: '已选记录包含跨页项，请切回对应页面后再导出。',
          }),
        );
        return;
      }
      exportSelectedAdminLoginLogs(selectedRows);
      return;
    }
    await exportAdminLoginLogs(query);
  };

  const renderTimeRangePanel = useCallback(
    (panelNode: React.ReactNode) => {
      const [displayStart, displayEnd] = formatTimeRangeRange(timeRangeDisplayValue);

      return (
        <div className="auth-login-log-page__time-range-shell">
          <div className="auth-login-log-page__time-range-shortcuts">
            <div className="auth-login-log-page__time-range-shortcut-row">
              {LOGIN_LOG_DURATION_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  size="mini"
                  type="outline"
                  className={`auth-login-log-page__time-range-shortcut ${
                    quickSelectPreset === preset.label
                      ? 'auth-login-log-page__time-range-shortcut--active'
                      : ''
                  }`}
                  onClick={() => {
                    handleTimeRangeShortcutApply(preset);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="auth-login-log-page__time-range-shortcut-row">
              {LOGIN_LOG_CALENDAR_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  size="mini"
                  type="outline"
                  className={`auth-login-log-page__time-range-shortcut ${
                    quickSelectPreset === preset.label
                      ? 'auth-login-log-page__time-range-shortcut--active'
                      : ''
                  }`}
                  onClick={() => {
                    handleTimeRangeShortcutApply(preset);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="auth-login-log-page__time-range-summary">
            <div className="auth-login-log-page__time-range-summary-item">
              <Typography.Text
                type="secondary"
                className="auth-login-log-page__time-range-summary-label"
              >
                开始时间
              </Typography.Text>
              <Typography.Text className="auth-login-log-page__time-range-summary-value">
                {displayStart}
              </Typography.Text>
            </div>
            <Typography.Text
              type="secondary"
              className="auth-login-log-page__time-range-summary-separator"
            >
              至
            </Typography.Text>
            <div className="auth-login-log-page__time-range-summary-item auth-login-log-page__time-range-summary-item--end">
              <Typography.Text
                type="secondary"
                className="auth-login-log-page__time-range-summary-label"
              >
                结束时间
              </Typography.Text>
              <Typography.Text className="auth-login-log-page__time-range-summary-value">
                {displayEnd}
              </Typography.Text>
            </div>
          </div>

          <div className="auth-login-log-page__time-range-panel-body">{panelNode}</div>
        </div>
      );
    },
    [handleTimeRangeShortcutApply, quickSelectPreset, timeRangeDisplayValue],
  );

  return (
    <PageContainer>
      <Space direction="vertical" size={16} className="system-page-template auth-login-log-page">
        <GovernanceSummaryBar
          className="auth-login-log-page__hero"
          eyebrow={t('auth.loginLog.hero.eyebrow')}
          title={t('auth.loginLog.hero.title')}
          description={t('auth.loginLog.hero.desc')}
          metrics={heroStats.slice(0, 3).map((item) => ({
            key: item.key,
            label: item.label,
            value: item.value,
          }))}
          action={
            <GovernanceRailToggleButton
              expanded={governanceRail.expanded}
              onToggle={governanceRail.toggle}
            >
              {t('auth.loginLog.hero.summaryTitle')}
            </GovernanceRailToggleButton>
          }
        />
        <>
          <FilterPanel>
            <Form form={queryForm} layout="vertical" onSubmit={() => search()}>
              <Row gutter={16} className="auth-filter-grid auth-login-log-page__filter-grid">
                <Col xs={24} md={10} lg={5}>
                  <FormItem label="时间范围">
                    <RangePicker
                      allowClear={false}
                      dayStartOfWeek={1}
                      format={DATETIME_FORMAT}
                      extra={
                        <Button
                          type="text"
                          size="mini"
                          onClick={() => {
                            closeTimeRangePopup();
                          }}
                        >
                          取消
                        </Button>
                      }
                      showTime={{ format: 'HH:mm' }}
                      value={timeRangeValue}
                      popupVisible={timeRangePopupVisible}
                      position="bl"
                      triggerElement={
                        <Button
                          className="auth-login-log-page__time-range-trigger"
                          htmlType="button"
                          type="outline"
                        >
                          <span className="auth-login-log-page__time-range-trigger-label">
                            {quickSelectPreset}
                          </span>
                          <IconCalendar className="auth-login-log-page__time-range-trigger-icon" />
                        </Button>
                      }
                      triggerProps={LOGIN_LOG_RANGE_PICKER_TRIGGER_PROPS}
                      panelRender={renderTimeRangePanel}
                      onChange={handleTimeRangeChange}
                      onSelect={handleTimeRangeSelect}
                      onVisibleChange={handleTimeRangePopupVisibleChange}
                    />
                  </FormItem>
                </Col>
                <Col xs={24} md={8} lg={4}>
                  <FormItem label={t('system.user.username')} field="username">
                    <Input onPressEnter={() => queryForm.submit()} />
                  </FormItem>
                </Col>
                <Col xs={24} md={8} lg={3}>
                  <FormItem label={t('auth.loginLog.status')} field="status">
                    <Select
                      allowClear
                      options={[
                        { label: t('auth.loginLog.status.success'), value: 1 },
                        { label: t('auth.loginLog.status.failed'), value: 0 },
                      ]}
                    />
                  </FormItem>
                </Col>
                <Col xs={24} lg={4}>
                  <FormItem className="filter-panel__action-item auth-login-log-page__filter-actions">
                    <Space direction="vertical">
                      <Space>
                        <Button type="primary" htmlType="submit" icon={<IconSearch />}>
                          {t('common.search')}
                        </Button>
                        <Button onClick={reset}>{t('common.reset')}</Button>
                      </Space>
                    </Space>
                  </FormItem>
                </Col>
              </Row>
            </Form>
          </FilterPanel>

          <Card className="page-panel system-list__table-card auth-login-log-page__table-card">
            <GovernanceCleanupBar
              showCleanup={canClear}
              retentionDays={retentionDays}
              retentionOptions={retentionOptions}
              onRetentionChange={setRetentionDays}
              retentionLabel={(option) => t('common.keepRecentDays', { count: option })}
              cleanupMode={cleanupMode}
              onCleanupModeChange={setCleanupMode}
              cleanupModeLabel={t('common.cleanupMode')}
              cleanupModeOptions={[
                { label: t('common.cleanupModeRetention'), value: 'retention' },
                { label: t('common.cleanupModeRange'), value: 'range' },
              ]}
              rangeStartDate={cleanupRangeStartDate}
              rangeStartTime={cleanupRangeStartTime}
              rangeEndDate={cleanupRangeEndDate}
              rangeEndTime={cleanupRangeEndTime}
              onRangeStartDateChange={setCleanupRangeStartDate}
              onRangeStartTimeChange={setCleanupRangeStartTime}
              onRangeEndDateChange={setCleanupRangeEndDate}
              onRangeEndTimeChange={setCleanupRangeEndTime}
              rangeStartDateLabel={t('common.cleanupRangeStartDate')}
              rangeStartTimeLabel={t('common.cleanupRangeStartTime')}
              rangeEndDateLabel={t('common.cleanupRangeEndDate')}
              rangeEndTimeLabel={t('common.cleanupRangeEndTime')}
              confirmTitle={
                cleanupMode === 'range'
                  ? t('common.cleanupRangeConfirm')
                  : t('auth.loginLog.cleanupConfirm', { count: retentionDays })
              }
              actionLabel={t('common.cleanupLogs')}
              onConfirm={() => {
                void handleCleanup();
              }}
              hint={t('auth.loginLog.hero.cleanupHint')}
              trailing={
                <Button
                  icon={<IconDownload />}
                  onClick={() => {
                    void handleExport();
                  }}
                  disabled={!canExport}
                >
                  {t('common.export')}
                </Button>
              }
              extraActions={
                canDelete ? (
                  <>
                    <Typography.Text type="secondary">
                      {t('common.selectedCount', { count: selectedRowKeys.length })}
                    </Typography.Text>
                    <Button
                      type="text"
                      size="small"
                      disabled={selectedRowKeys.length === 0}
                      onClick={() => {
                        if (selectedRowKeys.length === 0) {
                          return;
                        }
                        setSelectedRowKeys([]);
                        message.success(t('common.clearSelectionSuccess'));
                      }}
                    >
                      {t('common.clearSelection')}
                    </Button>
                    <PermissionAction
                      allowed={canDelete}
                      tooltip={t('common.noPermissionAction')}
                    >
                      <Popconfirm
                        disabled={selectedRowKeys.length === 0 || !canDelete}
                        title={t('auth.loginLog.batchDeleteConfirm', {
                          count: selectedRowKeys.length,
                        })}
                        onOk={() => {
                          void handleBatchDelete();
                        }}
                      >
                        <Button
                          status="danger"
                          icon={<IconDelete />}
                          disabled={selectedRowKeys.length === 0 || !canDelete}
                        >
                          {t('common.deleteSelected')}
                        </Button>
                      </Popconfirm>
                    </PermissionAction>
                  </>
                ) : undefined
              }
            />
            {loading && data.length === 0 ? <PageLoading /> : null}
            {loadError && !loading ? (
              <PageRequestError
                error={loadError}
                onRetry={() => {
                  void loadData(query);
                }}
              />
            ) : data.length === 0 && !loading ? (
              <PageEmpty description={t('auth.loginLog.empty')} />
            ) : (
              <AppTable<LoginLogRow>
                className="system-list__table"
                rowKey="id"
                data={data}
                columns={columns}
                loading={loading}
                scroll={{ x: 'max-content' }}
                onChange={handleTableChange}
                emptyText={t('auth.loginLog.empty')}
                rowSelection={
                  canDelete
                    ? {
                        type: 'checkbox',
                        selectedRowKeys: visibleSelectedRowKeys,
                        checkCrossPage: true,
                        preserveSelectedRowKeys: true,
                        onChange: (keys) =>
                          setSelectedRowKeys(
                            (currentKeys) =>
                              mergeCrossPageSelection(
                                currentKeys,
                                keys as number[],
                                data.map((item) => item.id),
                              ) as number[],
                          ),
                      }
                    : undefined
                }
                pagination={buildStandardPagination(t, {
                  current: query.page || emptyQuery.page,
                  pageSize: query.pageSize || emptyQuery.pageSize,
                  total,
                })}
              />
            )}
          </Card>
        </>
      </Space>
      <GovernanceInsightDrawer
        title={t('auth.loginLog.hero.summaryTitle')}
        visible={governanceRail.expanded}
        onClose={governanceRail.close}
        noteTitle={t('auth.security.loginLogHint')}
        noteDescription={t('auth.loginLog.hero.sideDesc')}
        noteTone="warning"
      >
        <GovernanceRailSummary
          items={[
            {
              label: t('auth.loginLog.status.success'),
              value: successCount,
              description: t('auth.loginLog.hero.successHint'),
            },
            {
              tone: 'warning',
              label: t('auth.loginLog.status.failed'),
              value: failedCount,
              description: t('auth.loginLog.hero.failedHint'),
            },
            {
              label: t('auth.loginLog.hero.window'),
              value: t('auth.loginLog.hero.windowValue'),
              description: t('auth.security.recentWindow'),
            },
            {
              label: t('common.selected'),
              value: selectedRowKeys.length,
              description: t('auth.loginLog.hero.selectedHint'),
            },
          ]}
        />
      </GovernanceInsightDrawer>
    </PageContainer>
  );
};

export default LoginLogList;
