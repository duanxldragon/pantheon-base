import React, { useCallback, useEffect, useState } from 'react';
import { Card, Table, Typography } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import {
  getMdqaorderList,
  type MdqaorderListQuery,
  type MdqaorderListRow,
} from './api';
import { PageContainer, PageError, PageLoading } from '../../../components';



const emptyQuery: MdqaorderListQuery = {
  name: '',
  status: '',
  page: 1,
  pageSize: 20,
};

const MdqaorderList: React.FC = () => {
  const [data, setData] = useState<MdqaorderListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState<MdqaorderListQuery>(emptyQuery);
  const { t } = useTranslation();

  const loadData = useCallback(async (nextQuery: MdqaorderListQuery = query) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMdqaorderList(nextQuery);
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
        <Typography.Title heading={5}>{t('business.mdqaorder.title')}</Typography.Title>
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
      title: t('business.mdqaorder.field.name.label'),
      dataIndex: 'name',
    },
            {
      title: t('business.mdqaorder.field.status.label'),
      dataIndex: 'status',
    },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default MdqaorderList;
      