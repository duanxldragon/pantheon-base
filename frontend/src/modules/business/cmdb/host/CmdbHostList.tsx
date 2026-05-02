import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Grid, Input, Space, Typography } from '@arco-design/web-react';
import { IconPlus, IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import {
  getCmdbHostList,
  type CmdbHostListQuery,
  type CmdbHostListRow,
} from './api';
import { AppTable, FilterPanel, ListHeaderActions, PageContainer, PageError, PageHeader, PageLoading, TABLE_ACTION_COLUMN_WIDTH, withTableColumnPriority } from '../../../../components';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const emptyQuery: CmdbHostListQuery = {
  hostCode: '',
  hostname: '',
  displayName: '',
  osName: '',
  status: '',
  lifecycleStatus: '',
  regionCode: '',
  idcCode: '',
  clusterName: '',
  ownerName: '',
  page: 1,
  pageSize: 20,
};

const CmdbHostList: React.FC = () => {
  const [data, setData] = useState<CmdbHostListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState<CmdbHostListQuery>(emptyQuery);
  const [queryForm] = Form.useForm<CmdbHostListQuery>();
  const { t } = useTranslation();

  const loadData = useCallback(async (nextQuery: CmdbHostListQuery = query) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCmdbHostList(nextQuery);
      setData(result.items);
      setTotal(result.total);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSearch = () => {
    const values = queryForm.getFieldsValue();
    const nextQuery = { ...query, ...values, page: 1 };
    setQuery(nextQuery);
    void loadData(nextQuery);
  };

  const handleReset = () => {
    queryForm.resetFields();
    setQuery(emptyQuery);
    void loadData(emptyQuery);
  };

  if (loading && data.length === 0) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError onRetry={() => { void loadData(); }} />;
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('business.cmdb.host.title')}
        breadcrumb={{
          items: [
            { title: t('app.home'), path: '/' },
            { title: t('business.cmdb.host.title') },
          ],
        }}
      />
      <FilterPanel>
        <Form form={queryForm} layout="vertical">
          <Row gutter={16}>
            <Col span={6}>
              <FormItem label={t('business.cmdb.host.field.hostCode.label')} field="hostCode">
                <Input placeholder={t('business.cmdb.host.field.hostCode.label')} />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label={t('business.cmdb.host.field.hostname.label')} field="hostname">
                <Input placeholder={t('business.cmdb.host.field.hostname.label')} />
              </FormItem>
            </Col>
            <Col span={12} style={{ textAlign: 'right', marginTop: 24 }}>
              <Space>
                <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
                  {t('common.search')}
                </Button>
                <Button onClick={handleReset}>
                  {t('common.reset')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </FilterPanel>

      <Card className="page-panel">
        <ListHeaderActions
          primary={
            <Button type="primary" icon={<IconPlus />}>
              {t('common.add')}
            </Button>
          }
        />
        <AppTable
          className="system-list__table"
          data={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total,
            showTotal: true,
            sizeCanChange: true,
            onChange: (page, pageSize) => {
              const nextQuery = { ...query, page, pageSize };
              setQuery(nextQuery);
              void loadData(nextQuery);
            },
          }}
          columns={[
            {
              title: t('business.cmdb.host.field.hostCode.label'),
              dataIndex: 'hostCode',
              fixed: 'left',
              width: 140,
            },
            {
              title: t('business.cmdb.host.field.hostname.label'),
              dataIndex: 'hostname',
              width: 180,
            },
            {
              title: t('business.cmdb.host.field.ipAddress.label'),
              dataIndex: 'ipAddress',
              width: 140,
            },
            {
              title: t('business.cmdb.host.field.osName.label'),
              dataIndex: 'osName',
              width: 160,
            },
            {
              title: t('business.cmdb.host.field.status.label'),
              dataIndex: 'status',
              width: 100,
            },
            {
              title: t('common.operations'),
              fixed: 'right',
              width: TABLE_ACTION_COLUMN_WIDTH.NORMAL,
              render: () => (
                <Space>
                  <Button type="text" size="small">{t('common.edit')}</Button>
                  <Button type="text" size="small" status="danger">{t('common.delete')}</Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default withTableColumnPriority(CmdbHostList);
