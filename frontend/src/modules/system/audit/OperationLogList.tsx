import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Grid,
  Input,
  Message,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/interface';
import type { ColumnProps, TableProps } from '@arco-design/web-react/es/Table/interface';
import { IconDelete, IconDownload, IconSearch, IconEye } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { getOperationLogList, deleteOperationLog, clearOperationLogs, exportOperationLogs, type OperationLogRow, type OperationLogQuery } from './api';
import { AppModal, AppTable, FilterPanel, PageActions, PageContainer, PageEmpty, PageError, PageHeader, PageLoading } from '../../../components';
import { formatDateTime } from '../../../core/format/dateTime';
import { usePermission } from '../../../hooks/usePermission';
import '../list-page.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const emptyQuery: OperationLogQuery = {
  title: '',
  operName: '',
  status: undefined,
  page: 1,
  pageSize: 10,
};

const OperationLogList: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, hasPerm } = usePermission();
  const canExport = isAdmin || hasPerm('system:operation-log:export');
  const [data, setData] = useState<OperationLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState<OperationLogQuery>(emptyQuery);
  const [queryForm] = Form.useForm<OperationLogQuery>();
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<OperationLogRow | null>(null);

  const loadData = useCallback(async (nextQuery: OperationLogQuery = query) => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const result = await getOperationLogList(nextQuery);
      setData(result.items);
      setTotal(result.total);
    } catch {
      setLoadFailed(true);
      Message.error(t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => {
    void loadData(query);
  }, [loadData, query]);

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

  const handleDelete = async (id: number) => {
    try {
      await deleteOperationLog(id);
      Message.success(t('common.deleteSuccess'));
      void loadData();
    } catch {
      // Message.error already handled by request interceptor
    }
  };

  const handleClear = async () => {
    try {
      await clearOperationLogs();
      Message.success(t('common.clearSuccess'));
      void loadData();
    } catch {
      // ...
    }
  };

  const showDetail = (log: OperationLogRow) => {
    setCurrentLog(log);
    setDetailVisible(true);
  };

  const handleTableChange: TableProps<OperationLogRow>['onChange'] = (pagination) => {
    setQuery({
      ...query,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || query.pageSize || emptyQuery.pageSize,
    });
  };

  const columns: ColumnProps<OperationLogRow>[] = [
    { title: t('system.audit.title'), dataIndex: 'title', width: 180, ellipsis: true },
    { title: t('system.audit.operName'), dataIndex: 'operName', width: 140 },
    { title: t('system.audit.operIp'), dataIndex: 'operIp', width: 140 },
    { title: t('system.audit.operUrl'), dataIndex: 'operUrl', ellipsis: true },
    {
      title: t('system.audit.status'),
      dataIndex: 'status',
      width: 120,
      render: (value: number) => value === 1 ? <Tag color="green">{t('common.success')}</Tag> : <Tag color="red">{t('common.failed')}</Tag>,
    },
    {
      title: t('system.audit.operTime'),
      dataIndex: 'operTime',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('common.operations'),
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size={4} className="system-list__actions">
          <Button type="text" size="small" icon={<IconEye />} onClick={() => showDetail(record)}>
            {t('common.detail')}
          </Button>
          {hasPerm('system:operation-log:delete') && (
            <Popconfirm title={t('common.deleteConfirm')} onOk={() => handleDelete(record.id)}>
              <Button type="text" status="danger" size="small" icon={<IconDelete />}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleExport = async () => {
    await exportOperationLogs(query);
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('system.menu.operationLog')}
        subtitle={t('system.audit.subtitle')}
        extra={(
          <PageActions>
            <Button icon={<IconDownload />} onClick={() => { void handleExport(); }} disabled={!canExport}>
              {t('common.export')}
            </Button>
          </PageActions>
        )}
      />
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <FilterPanel>
          <Form form={queryForm} layout="vertical">
            <Row gutter={16}>
              <Col span={6}>
                <FormItem label={t('system.audit.title')} field="title">
                  <Input />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem label={t('system.audit.operName')} field="operName">
                  <Input />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem label={t('system.audit.status')} field="status">
                  <Select
                    allowClear
                    options={[
                      { label: t('common.success'), value: 1 },
                      { label: t('common.failed'), value: 2 },
                    ]}
                  />
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
          <div style={{ marginBottom: 16 }}>
            {hasPerm('system:operation-log:clear') && (
              <PageActions>
                <Popconfirm title={t('common.clearConfirm')} onOk={handleClear}>
                  <Button type="primary" status="danger" icon={<IconDelete />}>
                    {t('common.clear')}
                  </Button>
                </Popconfirm>
              </PageActions>
            )}
          </div>

          {loading && data.length === 0 ? <PageLoading /> : null}
          {loadFailed && !loading ? (
            <PageError onRetry={() => { void loadData(query); }} />
          ) : data.length === 0 && !loading ? (
            <PageEmpty />
          ) : (
            <AppTable<OperationLogRow>
              className="system-list__table"
              rowKey="id"
              data={data}
              columns={columns}
              loading={loading}
              scroll={{ x: 1100 }}
              onChange={handleTableChange}
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
          )}
        </Card>
      </Space>

      <AppModal
        title={t('common.detail')}
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        size="detail"
      >
        {currentLog && (
          <Space direction="vertical" size={16} className="detail-stack">
            <Grid.Row gutter={16}>
              <Grid.Col span={12}>
                <Typography.Text type="secondary">{t('system.audit.title')}: </Typography.Text>
                <Typography.Text>{currentLog.title}</Typography.Text>
              </Grid.Col>
              <Grid.Col span={12}>
                <Typography.Text type="secondary">{t('system.audit.operTime')}: </Typography.Text>
                <Typography.Text>{formatDateTime(currentLog.operTime)}</Typography.Text>
              </Grid.Col>
            </Grid.Row>
            <Grid.Row gutter={16}>
              <Grid.Col span={12}>
                <Typography.Text type="secondary">{t('system.audit.operName')}: </Typography.Text>
                <Typography.Text>{currentLog.operName}</Typography.Text>
              </Grid.Col>
              <Grid.Col span={12}>
                <Typography.Text type="secondary">{t('system.audit.operIp')}: </Typography.Text>
                <Typography.Text>{currentLog.operIp}</Typography.Text>
              </Grid.Col>
            </Grid.Row>
            <Grid.Row gutter={16}>
              <Grid.Col span={24}>
                <Typography.Text type="secondary">{t('system.audit.operUrl')}: </Typography.Text>
                <Typography.Text>{currentLog.operUrl}</Typography.Text>
              </Grid.Col>
            </Grid.Row>
            <Grid.Row gutter={16}>
              <Grid.Col span={24}>
                <Typography.Text type="secondary">{t('system.audit.method')}: </Typography.Text>
                <Typography.Text>{currentLog.method}</Typography.Text>
              </Grid.Col>
            </Grid.Row>
            <Card className="detail-panel-card" title={t('system.audit.operParam')} size="small">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(currentLog.operParam), null, 2);
                  } catch {
                    return currentLog.operParam;
                  }
                })()}
              </pre>
            </Card>
            <Card className="detail-panel-card" title={t('system.audit.jsonResult')} size="small">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(currentLog.jsonResult), null, 2);
                  } catch {
                    return currentLog.jsonResult;
                  }
                })()}
              </pre>
            </Card>
            {currentLog.status === 2 && (
              <Card className="detail-panel-card" title={t('common.errorMsg')} size="small" style={{ borderColor: 'var(--danger-border)' }}>
                <Typography.Text type="error">{t(currentLog.errorMsg, { defaultValue: currentLog.errorMsg })}</Typography.Text>
              </Card>
            )}
          </Space>
        )}
      </AppModal>
    </PageContainer>
  );
};

export default OperationLogList;
