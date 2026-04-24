import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Message, Select, Space, Switch, Table, Tabs, Tag, Typography } from '@arco-design/web-react';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/interface';
import type { ColumnProps, TableProps } from '@arco-design/web-react/es/Table/interface';
import { IconRefresh } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { isNetworkRequestError, isServerRequestError, isTimeoutRequestError } from '../../../api/request';
import { FormSection, PageContainer, PageError, PageHeader, PageLoading, PageNetworkError, PageServerError, SubmitBar } from '../../../components';
import { formatDateTime } from '../../../core/format/dateTime';
import { applyPantheonDefaultTheme, applyPantheonTheme, pantheonThemeOptions, type PantheonThemeKey } from '../../../core/theme/theme';
import { hasExplicitLanguagePreference, refreshPublicSettings } from '../../../core/settings/publicSettings';
import { usePermission } from '../../../hooks/usePermission';
import {
  updateSettingGroup,
  getSettingAuditList,
  getSettingList,
  refreshSettingCache,
  type SettingAuditChange,
  type SettingAuditRow,
  type SettingItem,
} from './api';

const FormItem = Form.Item;

const groupOrder = ['basic', 'security', 'login', 'upload', 'i18n', 'ui'];
const defaultAuditPageSize = 5;

function buildFormValues(items: SettingItem[]) {
  return items.reduce<Record<string, string | number | boolean>>((acc, item) => {
    if (item.isEncrypted === 1) {
      acc[item.settingKey] = '';
      return acc;
    }
    if (item.valueType === 'number') {
      acc[item.settingKey] = item.settingValue === '' ? 0 : Number(item.settingValue);
    } else if (item.valueType === 'boolean') {
      acc[item.settingKey] = item.settingValue === 'true';
    } else {
      acc[item.settingKey] = item.settingValue;
    }
    return acc;
  }, {});
}

const SettingPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, hasPerm } = usePermission();
  const canUpdateSetting = isAdmin || hasPerm('system:setting:update');
  const canRefreshCache = isAdmin || hasPerm('system:setting:refresh');
  const [loading, setLoading] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState<string | null>(null);
  const [refreshingCache, setRefreshingCache] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [activeGroup, setActiveGroup] = useState(groupOrder[0]);
  const [auditRows, setAuditRows] = useState<SettingAuditRow[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditQuery, setAuditQuery] = useState({ page: 1, pageSize: defaultAuditPageSize });
  const [form] = Form.useForm<Record<string, string | number | boolean>>();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getSettingList();
      setSettings(rows);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const loadAudit = useCallback(async (groupKey: string, page = 1, pageSize = defaultAuditPageSize) => {
    setAuditLoading(true);
    try {
      const result = await getSettingAuditList({ groupKey, page, pageSize });
      setAuditRows(result.items);
      setAuditTotal(result.total);
      setAuditQuery({
        page: result.page || page,
        pageSize: result.pageSize || pageSize,
      });
    } catch {
      Message.error(t('common.loadFailed'));
    } finally {
      setAuditLoading(false);
    }
  }, [t]);

  const groupedSettings = useMemo(() => {
    const buckets = new Map<string, SettingItem[]>();
    settings.forEach((item) => {
      const list = buckets.get(item.groupKey) || [];
      list.push(item);
      buckets.set(item.groupKey, list);
    });
    return groupOrder
      .filter((groupKey) => buckets.has(groupKey))
      .map((groupKey) => ({ groupKey, items: buckets.get(groupKey) || [] }));
  }, [settings]);

  const activeSettingGroup = groupedSettings.find((item) => item.groupKey === activeGroup) || groupedSettings[0];
  const activeGroupKey = activeSettingGroup?.groupKey;

  useEffect(() => {
    if (groupedSettings.length > 0 && !groupedSettings.some((item) => item.groupKey === activeGroup)) {
      setActiveGroup(groupedSettings[0].groupKey);
    }
  }, [activeGroup, groupedSettings]);

  useEffect(() => {
    if (!activeSettingGroup) {
      return;
    }
    form.setFieldsValue(buildFormValues(activeSettingGroup.items));
  }, [activeSettingGroup, form]);

  useEffect(() => {
    if (!activeGroupKey) {
      setAuditRows([]);
      setAuditTotal(0);
      return;
    }
    void loadAudit(activeGroupKey, 1, defaultAuditPageSize);
  }, [activeGroupKey, loadAudit]);

  const resetActiveGroupValues = () => {
    if (!activeSettingGroup) {
      return;
    }
    form.setFieldsValue(buildFormValues(activeSettingGroup.items));
  };

  const handleSubmit = async () => {
    const group = activeSettingGroup;
    if (!group || !canUpdateSetting) {
      return;
    }
    const values = await form.validate();
    setSubmittingGroup(group.groupKey);
    try {
      await updateSettingGroup(group.groupKey, {
        items: group.items.map((item) => ({
          settingKey: item.settingKey,
          settingValue: item.valueType === 'boolean' ? String(Boolean(values[item.settingKey])) : String(values[item.settingKey] ?? ''),
        })),
      });
      if (group.groupKey === 'ui') {
        const nextTheme = values['ui.default_theme'];
        if (typeof nextTheme === 'string') {
          applyPantheonDefaultTheme(nextTheme as PantheonThemeKey);
          applyPantheonTheme(nextTheme as PantheonThemeKey);
        }
      }
      if (['basic', 'i18n', 'ui'].includes(group.groupKey)) {
        const publicSettings = await refreshPublicSettings().catch(() => null);
        if (group.groupKey === 'i18n' && publicSettings && !hasExplicitLanguagePreference()) {
          await i18n.changeLanguage(publicSettings.defaultLanguage).catch(() => undefined);
        }
      }
      Message.success(t('common.updateSuccess'));
      await loadData();
      await loadAudit(group.groupKey, 1, auditQuery.pageSize);
    } finally {
      setSubmittingGroup(null);
    }
  };

  const handleRefreshCache = async () => {
    if (!activeGroupKey) {
      return;
    }
    setRefreshingCache(true);
    try {
      await refreshSettingCache({ groupKeys: [activeGroupKey] });
      Message.success(t('system.setting.cache.refreshSuccess'));
      await loadData();
      await loadAudit(activeGroupKey, 1, auditQuery.pageSize);
    } finally {
      setRefreshingCache(false);
    }
  };

  const renderField = (item: SettingItem) => {
    const label = t(`system.setting.item.${item.settingKey}`, item.settingKey);
    const remark = t(item.remark, '');
    const help = (
      <Space direction="vertical" size={4}>
        {remark ? <span>{remark}</span> : null}
        {item.isEncrypted === 1 ? (
          <Space size={8} wrap>
            <Tag color="red">{t('system.setting.encrypted')}</Tag>
            <Typography.Text type="secondary">
              {item.hasValue === 1 ? t('system.setting.leaveEmptyToKeep') : t('system.setting.encryptedEmptyHint')}
            </Typography.Text>
          </Space>
        ) : null}
      </Space>
    );

    if (item.settingKey === 'ui.default_theme') {
      return (
        <FormItem key={item.settingKey} field={item.settingKey} label={label} extra={help}>
          <Select
            options={pantheonThemeOptions.map((theme) => ({
              label: `${t(theme.labelKey)} · ${t(theme.descriptionKey)}`,
              value: theme.key,
            }))}
          />
        </FormItem>
      );
    }

    if (item.valueType === 'boolean') {
      return (
        <FormItem key={item.settingKey} field={item.settingKey} label={label} triggerPropName="checked">
          <Switch checkedText={t('common.yes')} uncheckedText={t('common.no')} />
        </FormItem>
      );
    }
    if (item.valueType === 'number') {
      return (
        <FormItem key={item.settingKey} field={item.settingKey} label={label} extra={help}>
          <InputNumber style={{ width: '100%' }} />
        </FormItem>
      );
    }
    if (item.isEncrypted === 1) {
      return (
        <FormItem key={item.settingKey} field={item.settingKey} label={label} extra={help}>
          <Input.Password
            placeholder={item.hasValue === 1 ? t('system.setting.leaveEmptyToKeep') : t('system.setting.encryptedPlaceholder')}
          />
        </FormItem>
      );
    }
    if (item.valueType === 'json') {
      return (
        <FormItem key={item.settingKey} field={item.settingKey} label={label} extra={help}>
          <Input.TextArea autoSize={{ minRows: 4, maxRows: 10 }} />
        </FormItem>
      );
    }
    return (
      <FormItem key={item.settingKey} field={item.settingKey} label={label} extra={help}>
        <Input />
      </FormItem>
    );
  };

  const renderErrorState = () => {
    if (isNetworkRequestError(error)) {
      return <PageNetworkError timeout={isTimeoutRequestError(error)} onRetry={() => { void loadData(); }} />;
    }
    if (isServerRequestError(error)) {
      return <PageServerError onRetry={() => { void loadData(); }} />;
    }
    return <PageError onRetry={() => { void loadData(); }} />;
  };

  const renderAuditChange = (change: SettingAuditChange) => {
    const label = t(`system.setting.item.${change.settingKey}`, change.settingKey);
    if (change.isEncrypted === 1) {
      return (
        <Space size={6} wrap>
          <Typography.Text>{label}</Typography.Text>
          <Tag color="red">{t('system.setting.audit.sensitiveChanged')}</Tag>
        </Space>
      );
    }
    const oldValue = change.oldValue || '-';
    const newValue = change.newValue || '-';
    return (
      <Space size={6} wrap>
        <Typography.Text>{label}</Typography.Text>
        <Typography.Text type="secondary">{oldValue}</Typography.Text>
        <Typography.Text type="secondary">→</Typography.Text>
        <Typography.Text>{newValue}</Typography.Text>
      </Space>
    );
  };

  const auditColumns: ColumnProps<SettingAuditRow>[] = [
    {
      title: t('system.setting.audit.operator'),
      dataIndex: 'operName',
      render: (value: string) => value || '-',
    },
    {
      title: t('system.setting.audit.ip'),
      dataIndex: 'operIp',
      render: (value: string) => value || '-',
    },
    {
      title: t('system.setting.audit.changes'),
      dataIndex: 'changes',
      render: (changes: SettingAuditChange[]) => (
        <Space direction="vertical" size={4}>
          {changes.length > 0 ? changes.map((change) => (
            <div key={change.settingKey}>{renderAuditChange(change)}</div>
          )) : (
            <Typography.Text type="secondary">{t('system.setting.audit.noChange')}</Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: t('system.setting.audit.status'),
      dataIndex: 'status',
      render: (value: number) => value === 1 ? (
        <Tag color="green">{t('auth.loginLog.status.success')}</Tag>
      ) : (
        <Tag color="red">{t('auth.loginLog.status.failed')}</Tag>
      ),
    },
    {
      title: t('system.setting.audit.operTime'),
      dataIndex: 'operTime',
      render: (value: string) => formatDateTime(value),
    },
  ];

  const handleAuditTableChange: TableProps<SettingAuditRow>['onChange'] = (pagination) => {
    if (!activeGroupKey) {
      return;
    }
    void loadAudit(
      activeGroupKey,
      pagination.current || 1,
      pagination.pageSize || auditQuery.pageSize,
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('system.menu.setting')}
        subtitle={t('system.setting.subtitle')}
      />
      {loading && settings.length === 0 ? <PageLoading /> : null}
      {error && settings.length === 0 ? renderErrorState() : null}
      {settings.length > 0 ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card className="page-panel">
            <Tabs
              type="rounded"
              activeTab={activeSettingGroup?.groupKey}
              onChange={setActiveGroup}
            >
              {groupedSettings.map((group) => (
                <Tabs.TabPane key={group.groupKey} title={t(`system.setting.group.${group.groupKey}`)} />
              ))}
            </Tabs>
            {activeSettingGroup ? (
              <Form form={form} layout="vertical">
                <Space direction="vertical" size={16} className="dialog-form-stack" style={{ marginTop: 16 }}>
                  <FormSection
                    title={t(`system.setting.group.${activeSettingGroup.groupKey}`)}
                    description={t(`system.setting.groupHint.${activeSettingGroup.groupKey}`, '')}
                  >
                    {activeSettingGroup.items.map(renderField)}
                  </FormSection>
                  <Typography.Text type="secondary">{t('system.setting.saveHint')}</Typography.Text>
                  <Space>
                    <Button
                      icon={<IconRefresh />}
                      loading={refreshingCache}
                      onClick={() => { void handleRefreshCache(); }}
                      disabled={!canRefreshCache || !activeGroupKey}
                    >
                      {t('system.setting.cache.refresh')}
                    </Button>
                  </Space>
                  <SubmitBar
                    loading={submittingGroup === activeSettingGroup.groupKey}
                    submitDisabled={!canUpdateSetting}
                    onCancel={resetActiveGroupValues}
                    onSubmit={() => { void handleSubmit(); }}
                  />
                </Space>
              </Form>
            ) : null}
          </Card>
          {activeSettingGroup ? (
            <Card className="page-panel" title={t('system.setting.audit.title')}>
              <Table
                rowKey="id"
                data={auditRows}
                columns={auditColumns}
                loading={auditLoading}
                onChange={handleAuditTableChange}
                pagination={{
                  current: auditQuery.page,
                  pageSize: auditQuery.pageSize,
                  total: auditTotal,
                  showJumper: true,
                  pageSizeChangeResetCurrent: false,
                  sizeCanChange: true,
                  sizeOptions: [5, 10, 20, 50],
                  size: 'small',
                  showTotal: (count: number) => t('common.total', { count }),
                } as PaginationProps}
              />
            </Card>
          ) : null}
        </Space>
      ) : null}
    </PageContainer>
  );
};

export default SettingPage;
