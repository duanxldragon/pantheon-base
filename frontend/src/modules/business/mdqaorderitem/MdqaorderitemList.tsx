import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Space, Tag, Card, Table, Typography } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import {
  getMdqaorderitemList,
  type MdqaorderitemListQuery,
  type MdqaorderitemListRow,
} from './api';
import { PageContainer, PageError, PageLoading } from '../../../components';

const governanceTableRole = 'detail';
const governancePrimaryTable = 'biz_mdqa_order';
const governanceRelationFromField = 'orderId';
const governanceRelationToField = 'id';



const emptyQuery: MdqaorderitemListQuery = {
  itemName: '',
  orderId: 0,
  page: 1,
  pageSize: 20,
};

const MdqaorderitemList: React.FC = () => {
  const [data, setData] = useState<MdqaorderitemListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState<MdqaorderitemListQuery>(emptyQuery);
  const { t } = useTranslation();

  const loadData = useCallback(async (nextQuery: MdqaorderitemListQuery = query) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMdqaorderitemList(nextQuery);
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

  if (loading && data.length === 0) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError onRetry={() => { void loadData(); }} />;
  }

  return (
    <PageContainer>
      <Card bordered={false}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="info"
            content={t('generator.wizard.relationFields.help')}
          />
          <Space wrap>
            <Tag color="purple">{t(`generator.wizard.tableRole.${governanceTableRole}`)}</Tag>
            {governancePrimaryTable ? <Tag color="arcoblue">{governancePrimaryTable}</Tag> : null}
            {governanceRelationFromField ? <Tag color="orange">{governanceRelationFromField}</Tag> : null}
            {governanceRelationToField ? <Tag color="orange">{governanceRelationToField}</Tag> : null}
          </Space>
          <Typography.Text type="secondary">
            {t('generator.wizard.relationFields')}
          </Typography.Text>
        </Space>
        </Card>
      <Card bordered={false}>
        <Typography.Title heading={5}>{t('business.mdqaorderitem.title')}</Typography.Title>
        <Table
          data={data}
          rowKey="id"
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total,
            showTotal: true,
            onChange: (page, pageSize) => {
              const nextQuery = { ...query, page, pageSize };
              setQuery(nextQuery);
              void loadData(nextQuery);
            },
          }}
          columns={[
            {
      title: t('business.mdqaorderitem.field.itemName.label'),
      dataIndex: 'itemName',
    },
            {
      title: t('business.mdqaorderitem.field.quantity.label'),
      dataIndex: 'quantity',
    },
            {
      title: t('business.mdqaorderitem.field.enabled.label'),
      dataIndex: 'enabled',
    },
            {
      title: t('business.mdqaorderitem.field.orderId.label'),
      dataIndex: 'orderId',
    },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default MdqaorderitemList;
      