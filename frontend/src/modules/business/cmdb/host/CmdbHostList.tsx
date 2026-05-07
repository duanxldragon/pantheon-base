import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  Message,
  Form,
  Input,
  Select,
  Modal,
} from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete, IconCode, IconEye } from '@arco-design/web-react/icon';
import type { ColumnProps, PaginationProps } from '@arco-design/web-react';
import { PageContainer } from '../../../../components/patterns/PageContainer';
import { PageHeader } from '../../../../components/patterns/PageHeader';
import { FilterPanel } from '../../../../components/patterns/FilterPanel';
import { AppTable } from '../../../../components/data-display/AppTable';
import { ListHeaderActions } from '../../../../components/patterns/ListHeaderActions';
import { getHostList, deleteHost, HostRow, HostListQuery } from './api';
import { usePermission } from '../../../../hooks/usePermission';
import CmdbHostForm from './CmdbHostForm';
import '../../../system/list-page.css';

const statusColorMap: Record<string, string> = {
  pending: 'gray',
  online: 'green',
  offline: 'red',
  maintenance: 'orange',
};

const osColorMap: Record<string, string> = {
  linux: 'blue',
  windows: 'arcoblue',
};

export default function CmdbHostList() {
  const { t } = useTranslation();
  const { hasPerm } = usePermission();
  const navigate = useNavigate();

  const [data, setData] = useState<HostRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState<HostListQuery>({ page: 1, pageSize: 10 });
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<HostRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterOS, setFilterOS] = useState<string>('');

  const canCreate = hasPerm('business:cmdb:host:create');
  const canUpdate = hasPerm('business:cmdb:host:update');
  const canDelete = hasPerm('business:cmdb:host:delete');
  const canCollect = hasPerm('business:cmdb:host:collect');

  const loadData = useCallback(
    async (nextQuery = query) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getHostList(nextQuery);
        setData(result.items);
        setTotal(result.total);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [query],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = () => {
    setQuery((prev) => ({ ...prev, page: 1, keyword, status: filterStatus, os: filterOS }));
  };

  const handleReset = () => {
    setKeyword('');
    setFilterStatus('');
    setFilterOS('');
    setQuery({ page: 1, pageSize: 10 });
  };

  const handleDelete = async (id: number) => {
    await deleteHost(id);
    Message.success(t('common.deleteSuccess'));
    loadData(query);
  };

  const handleFormSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (editing) {
        const { updateHost } = await import('./api');
        await updateHost(editing.id, values);
        Message.success(t('common.updateSuccess'));
      } else {
        const { createHost } = await import('./api');
        await createHost(values);
        Message.success(t('common.createSuccess'));
      }
      setVisible(false);
      setEditing(null);
      loadData(query);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row: HostRow) => {
    setEditing(row);
    setVisible(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setVisible(true);
  };

  const handlePageChange = (page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setQuery((prev) => ({ ...prev, page: 1, pageSize }));
  };

  const columns: ColumnProps<HostRow>[] = [
    {
      title: t('business.cmdb.host.hostname'),
      dataIndex: 'hostname',
      width: 150,
    },
    {
      title: t('business.cmdb.host.ip'),
      dataIndex: 'ip',
      width: 140,
    },
    {
      title: t('business.cmdb.host.os'),
      dataIndex: 'os',
      width: 100,
      render: (_, row) => <Tag color={osColorMap[row.os] || 'gray'}>{row.os}</Tag>,
    },
    {
      title: 'CPU',
      dataIndex: 'cpuCores',
      width: 80,
      render: (_, row) => (row.cpuCores ? `${row.cpuCores} Cores` : '-'),
    },
    {
      title: t('business.cmdb.host.memoryGb'),
      dataIndex: 'memoryGb',
      width: 100,
      render: (_, row) => (row.memoryGb ? `${row.memoryGb} GB` : '-'),
    },
    {
      title: t('business.cmdb.host.diskGb'),
      dataIndex: 'diskGb',
      width: 100,
      render: (_, row) => (row.diskGb ? `${row.diskGb} GB` : '-'),
    },
    {
      title: t('business.cmdb.host.status'),
      dataIndex: 'status',
      width: 100,
      render: (_, row) => (
        <Tag color={statusColorMap[row.status] || 'gray'}>
          {t(`business.cmdb.host.status.${row.status}`)}
        </Tag>
      ),
    },
    {
      title: t('business.cmdb.host.labels'),
      dataIndex: 'labelValues',
      width: 200,
      render: (_, row) =>
        row.labelValues?.length ? (
          <Space wrap size={4}>
            {row.labelValues.map((l, i) => (
              <Tag key={i} size="small">
                {l.key}={l.val}
              </Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: t('common.action'),
      key: 'action',
      fixed: 'right',
      width: 220,
      render: (_, row) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={() => navigate(`/operations/cmdb/host/${row.id}`)}
          >
            {t('common.detail')}
          </Button>
          {canUpdate && (
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleEdit(row)}
            >
              {t('common.edit')}
            </Button>
          )}
          {canCollect && row.os === 'linux' && (
            <Button
              type="text"
              size="small"
              icon={<IconCode />}
              onClick={() => navigate(`/operations/cmdb/host/${row.id}?collect=1`)}
            >
              {t('business.cmdb.host.collect')}
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title={t('business.cmdb.host.deleteConfirm')}
              onOk={() => handleDelete(row.id)}
            >
              <Button type="text" size="small" status="danger" icon={<IconDelete />}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const pagination: PaginationProps = {
    current: query.page || 1,
    pageSize: query.pageSize || 10,
    total,
    sizeOptions: [10, 20, 50, 100],
    onChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    showTotal: true,
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('business.cmdb.host.title')}
        extra={
          <ListHeaderActions
            primary={
              canCreate ? (
                <Button type="primary" icon={<IconPlus />} onClick={handleCreate}>
                  {t('common.add')}
                </Button>
              ) : null
            }
          />
        }
      />
      <Space direction="vertical" size={16} className="system-page-template">
        <FilterPanel onSearch={handleSearch} onReset={handleReset}>
          <Form.Item label={t('common.keyword')}>
            <Input
              value={keyword}
              onChange={setKeyword}
              placeholder={t('common.keyword')}
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item label={t('business.cmdb.host.status')}>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder={t('common.all')}
              allowClear
              style={{ width: 140 }}
            >
              {['pending', 'online', 'offline', 'maintenance'].map((s) => (
                <Select.Option key={s} value={s}>
                  {t(`business.cmdb.host.status.${s}`)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label={t('business.cmdb.host.os')}>
            <Select
              value={filterOS}
              onChange={setFilterOS}
              placeholder={t('common.all')}
              allowClear
              style={{ width: 140 }}
            >
              {['linux', 'windows'].map((o) => (
                <Select.Option key={o} value={o}>
                  {o}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </FilterPanel>
        <Card className="page-panel system-list__table-card">
          <AppTable
            columns={columns}
            data={data}
            loading={loading}
            pagination={pagination}
            rowKey="id"
            scroll={{ x: 1200 }}
          />
        </Card>
      </Space>
      <Modal
        visible={visible}
        onCancel={() => {
          setVisible(false);
          setEditing(null);
        }}
        title={
          editing
            ? t('business.cmdb.host.editTitle')
            : t('business.cmdb.host.createTitle')
        }
        footer={null}
        style={{ width: 640 }}
      >
        <CmdbHostForm
          editing={editing}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setVisible(false);
            setEditing(null);
          }}
          submitting={submitting}
        />
      </Modal>
    </PageContainer>
  );
}
