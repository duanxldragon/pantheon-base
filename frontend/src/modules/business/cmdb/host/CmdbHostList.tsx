import React, { useCallback, useEffect, useState } from 'react';
import { Card, Table, Typography } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import {
  getCmdbHostList,
  type CmdbHostListQuery,
  type CmdbHostListRow,
} from './api';
import { PageContainer, PageError, PageLoading } from '../../../../components';

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

  if (loading && data.length === 0) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError onRetry={() => { void loadData(); }} />;
  }

  return (
    <PageContainer>
      <Card bordered={false}>
        <Typography.Title heading={5}>{t('business.cmdb.host.title')}</Typography.Title>
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
      title: t('business.cmdb.host.field.hostCode.label'),
      dataIndex: 'hostCode',
    },
            {
      title: t('business.cmdb.host.field.hostname.label'),
      dataIndex: 'hostname',
    },
            {
      title: t('business.cmdb.host.field.displayName.label'),
      dataIndex: 'displayName',
    },
            {
      title: t('business.cmdb.host.field.ipAddress.label'),
      dataIndex: 'ipAddress',
    },
            {
      title: t('business.cmdb.host.field.sshPort.label'),
      dataIndex: 'sshPort',
    },
            {
      title: t('business.cmdb.host.field.osFamily.label'),
      dataIndex: 'osFamily',
    },
            {
      title: t('business.cmdb.host.field.osName.label'),
      dataIndex: 'osName',
    },
            {
      title: t('business.cmdb.host.field.kernelVersion.label'),
      dataIndex: 'kernelVersion',
    },
            {
      title: t('business.cmdb.host.field.arch.label'),
      dataIndex: 'arch',
    },
            {
      title: t('business.cmdb.host.field.environment.label'),
      dataIndex: 'environment',
    },
            {
      title: t('business.cmdb.host.field.status.label'),
      dataIndex: 'status',
    },
            {
      title: t('business.cmdb.host.field.lifecycleStatus.label'),
      dataIndex: 'lifecycleStatus',
    },
            {
      title: t('business.cmdb.host.field.provider.label'),
      dataIndex: 'provider',
    },
            {
      title: t('business.cmdb.host.field.regionCode.label'),
      dataIndex: 'regionCode',
    },
            {
      title: t('business.cmdb.host.field.idcCode.label'),
      dataIndex: 'idcCode',
    },
            {
      title: t('business.cmdb.host.field.clusterName.label'),
      dataIndex: 'clusterName',
    },
            {
      title: t('business.cmdb.host.field.ownerUserId.label'),
      dataIndex: 'ownerUserId',
    },
            {
      title: t('business.cmdb.host.field.ownerName.label'),
      dataIndex: 'ownerName',
    },
            {
      title: t('business.cmdb.host.field.maintainerTeam.label'),
      dataIndex: 'maintainerTeam',
    },
            {
      title: t('business.cmdb.host.field.purpose.label'),
      dataIndex: 'purpose',
    },
            {
      title: t('business.cmdb.host.field.lastCheckInAt.label'),
      dataIndex: 'lastCheckInAt',
    },
            {
      title: t('business.cmdb.host.field.lastInventoryAt.label'),
      dataIndex: 'lastInventoryAt',
    },
            {
      title: t('business.cmdb.host.field.lastOperatedAt.label'),
      dataIndex: 'lastOperatedAt',
    },
            {
      title: t('business.cmdb.host.field.remark.label'),
      dataIndex: 'remark',
    },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default CmdbHostList;
      