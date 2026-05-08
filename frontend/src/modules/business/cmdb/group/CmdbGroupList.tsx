import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Button,
  Tag,
  Space,
  Popconfirm,
  Message,
  Typography,
  Tree,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconEye,
  IconBranch,
} from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table/interface';
import type { TreeDataType } from '@arco-design/web-react/es/Tree/interface';
import { AppDrawer, AppModal, PageEmpty, PageError, PageLoading } from '../../../../components';
import PageContainer from '../../../../components/patterns/PageContainer';
import PageHeader from '../../../../components/patterns/PageHeader';
import ListHeaderActions from '../../../../components/patterns/ListHeaderActions';
import AppTable from '../../../../components/data-display/AppTable';
import { getGroupList, getGroupMembers, createGroup, updateGroup, deleteGroup } from './api';
import type { GroupRow, GroupMemberResp } from './api';
import CmdbGroupForm from './CmdbGroupForm';
import { usePermission } from '../../../../hooks/usePermission';
import '../../../system/list-page.css';
import '../cmdb.css';

export default function CmdbGroupList() {
  const { t } = useTranslation();
  const { hasPerm } = usePermission();

  const [data, setData] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<GroupRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [membersDrawer, setMembersDrawer] = useState(false);
  const [memberData, setMemberData] = useState<GroupMemberResp | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const canCreate = hasPerm('business:cmdb:group:create');
  const canUpdate = hasPerm('business:cmdb:group:update');
  const canDelete = hasPerm('business:cmdb:group:delete');
  const canDetail = hasPerm('business:cmdb:group:detail');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getGroupList();
      setData(result);
      setSelectedGroupId((current) => current ?? result[0]?.id ?? null);
    } catch (err) {
      setError(err);
      Message.error(t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!selectedGroupId && data.length > 0) {
      setSelectedGroupId(data[0].id);
    }
    if (selectedGroupId && !data.some((item) => item.id === selectedGroupId)) {
      setSelectedGroupId(data[0]?.id ?? null);
    }
  }, [data, selectedGroupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: number) => {
    await deleteGroup(id);
    Message.success(t('common.deleteSuccess'));
    loadData();
  };

  const handleFormSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateGroup(editing.id, values);
        Message.success(t('common.updateSuccess'));
      } else {
        await createGroup(values);
        Message.success(t('common.createSuccess'));
      }
      setVisible(false);
      setEditing(null);
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewMembers = async (row: GroupRow) => {
    if (!canDetail) return;
    const result = await getGroupMembers(row.id);
    setMemberData(result);
    setMembersDrawer(true);
  };

  const selectedGroup = useMemo(
    () => data.find((item) => item.id === selectedGroupId) || data[0] || null,
    [data, selectedGroupId],
  );

  const groupTreeData = useMemo<TreeDataType[]>(() => {
    return data.map((group) => {
      const operatorNode = {
        title: t(`business.cmdb.group.condition.operator.${(group.conditions?.operator || 'AND').toLowerCase()}`),
        key: `group-${group.id}-operator`,
        selectable: false,
        children: group.conditions?.rules?.length
          ? group.conditions.rules.map((rule, index) => ({
              title: (
                <span className="cmdb-page__tree-node-copy">
                  <span className="cmdb-page__tree-node-title">
                    {rule.key} {t(`business.cmdb.group.condition.op.${rule.op}`)} {rule.val}
                  </span>
                  <span className="cmdb-page__tree-node-subtitle">
                    {t('business.cmdb.group.condition.ruleIndex', { count: index + 1 })}
                  </span>
                </span>
              ),
              key: `group-${group.id}-rule-${index}`,
              selectable: false,
              searchText: `${rule.key} ${rule.op} ${rule.val}`,
            }))
          : undefined,
        searchText: group.conditions?.rules?.map((rule) => `${rule.key} ${rule.op} ${rule.val}`).join(' '),
      } as TreeDataType;

      return {
        title: (
          <div className="cmdb-page__tree-node">
            <span className="cmdb-page__tree-node-copy">
              <span className="cmdb-page__tree-node-title">{group.name}</span>
              <span className="cmdb-page__tree-node-subtitle">
                {t('business.cmdb.group.members')}
                {' · '}
                {group.memberCount}
              </span>
            </span>
            <Tag size="small" color={group.id === selectedGroupId ? 'arcoblue' : 'gray'}>
              {group.memberCount}
            </Tag>
          </div>
        ),
        key: String(group.id),
        searchText: `${group.name} ${group.description} ${group.conditions?.rules
          ?.map((rule) => `${rule.key} ${rule.op} ${rule.val}`)
          .join(' ')}`,
        children: [operatorNode],
      } as TreeDataType;
    });
  }, [data, selectedGroupId, t]);

  const defaultExpandedKeys = useMemo(
    () => data.flatMap((group) => [String(group.id), `group-${group.id}-operator`]),
    [data],
  );

  const heroStats = useMemo(
    () => [
      {
        key: 'total',
        label: t('business.cmdb.group.hero.total'),
        value: data.length,
        hint: t('business.cmdb.group.hero.totalHint'),
      },
      {
        key: 'members',
        label: t('business.cmdb.group.hero.members'),
        value: selectedGroup?.memberCount || 0,
        hint: t('business.cmdb.group.hero.membersHint'),
      },
      {
        key: 'scope',
        label: t('business.cmdb.group.hero.scope'),
        value: t('business.cmdb.group.hero.scopeValue'),
        hint: t('business.cmdb.group.hero.scopeHint'),
      },
      {
        key: 'rules',
        label: t('business.cmdb.group.hero.rules'),
        value: selectedGroup?.conditions?.rules?.length || 0,
        hint: t('business.cmdb.group.hero.rulesHint'),
      },
    ],
    [data.length, selectedGroup, t],
  );

  const columns: ColumnProps<GroupRow>[] = [
    {
      title: t('business.cmdb.group.name'),
      dataIndex: 'name',
      width: 200,
      render: (_: unknown, row: GroupRow) => (
        <Space>
          <IconBranch />
          {row.name}
        </Space>
      ),
    },
    {
      title: t('business.cmdb.group.description'),
      dataIndex: 'description',
      width: 300,
      render: (_: unknown, row: GroupRow) => row.description || '-',
    },
    {
      title: t('business.cmdb.group.conditions'),
      dataIndex: 'conditions',
      width: 300,
      render: (_: unknown, row: GroupRow) =>
        row.conditions?.rules?.length ? (
          <Space wrap size={4}>
            {row.conditions.rules.map((r, i) => (
              <Tag key={i} size="small">
                {r.key} {r.op} {r.val}
              </Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: t('business.cmdb.group.memberCount'),
      dataIndex: 'memberCount',
      width: 100,
      render: (_: unknown, row: GroupRow) => (
        <Tag color="arcoblue">{row.memberCount}</Tag>
      ),
    },
    {
      title: t('common.action'),
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_: unknown, row: GroupRow) => (
        <Space>
          {canDetail && (
            <Button
              type="text"
              size="small"
              icon={<IconEye />}
              onClick={() => handleViewMembers(row)}
            >
              {t('business.cmdb.group.members')}
            </Button>
          )}
          {canUpdate && (
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => {
                setEditing(row);
                setVisible(true);
              }}
            >
              {t('common.edit')}
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title={t('business.cmdb.group.deleteConfirm')}
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

  return (
    <PageContainer>
      <PageHeader
        title={t('business.cmdb.group.title')}
        extra={
          <ListHeaderActions
            primary={
              canCreate ? (
                <Button type="primary" icon={<IconPlus />} onClick={() => {
                  setEditing(null);
                  setVisible(true);
                }}>
                  {t('common.add')}
                </Button>
              ) : null
            }
          />
        }
      />
      <Space direction="vertical" size={16} className="system-page-template">
        <Card className="page-panel system-page-hero cmdb-page__hero">
          <div className="system-page-hero__top">
            <div className="system-page-hero__copy">
              <span className="system-page-hero__eyebrow">{t('business.cmdb.group.hero.eyebrow')}</span>
              <Typography.Title heading={5} className="system-page-hero__title cmdb-page__hero-title">
                {t('business.cmdb.group.hero.title')}
              </Typography.Title>
            </div>
          </div>
          <div className="cmdb-page__hero-grid">
            {heroStats.map((item) => (
              <div key={item.key} className="cmdb-page__hero-metric">
                <span className="cmdb-page__hero-label">{item.label}</span>
                <span className="cmdb-page__hero-value">{item.value}</span>
                <span className="cmdb-page__hero-hint">{item.hint}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="cmdb-page__split">
          <Card className="page-panel cmdb-page__side-panel">
            <Typography.Title heading={6} style={{ marginTop: 0 }}>
              {t('business.cmdb.group.tree.title')}
            </Typography.Title>
            {loading && data.length === 0 ? <PageLoading /> : null}
            {!loading && error && data.length === 0 ? (
              <PageError description={t('common.loadFailedDesc')} onRetry={loadData} />
            ) : null}
            {!loading && !error && data.length === 0 ? (
              <PageEmpty description={t('business.cmdb.group.empty')} />
            ) : null}
            {!loading && !(error && data.length === 0) && data.length > 0 ? (
              <Tree
                blockNode
                showLine
                defaultExpandedKeys={defaultExpandedKeys}
                treeData={groupTreeData}
                selectedKeys={selectedGroupId ? [String(selectedGroupId)] : []}
                onSelect={(keys) => {
                  const nextKey = keys[0];
                  if (!nextKey) return;
                  const nextId = Number(nextKey);
                  if (!Number.isNaN(nextId)) {
                    setSelectedGroupId(nextId);
                  }
                }}
              />
            ) : null}
          </Card>
          <div className="cmdb-page__content-stack">
            <Card className="page-panel system-list__table-card cmdb-page__group-table-card">
              {loading && data.length === 0 ? <PageLoading /> : null}
              {!loading && error && data.length === 0 ? (
                <PageError description={t('common.loadFailedDesc')} onRetry={loadData} />
              ) : null}
              {!loading && !error && data.length === 0 ? (
                <PageEmpty description={t('business.cmdb.group.empty')} />
              ) : null}
              {!loading && !(error && data.length === 0) && data.length > 0 ? (
                <AppTable
                  columns={columns}
                  data={data}
                  loading={loading}
                  pagination={false}
                  rowKey="id"
                  rowClassName={(record) =>
                    record.id === selectedGroupId ? 'cmdb-page__group-row--active' : ''
                  }
                />
              ) : null}
            </Card>
          </div>
        </div>
      </Space>
      <AppModal
        visible={visible}
        onCancel={() => {
          setVisible(false);
          setEditing(null);
        }}
        title={
          editing
            ? t('business.cmdb.group.editTitle')
            : t('business.cmdb.group.createTitle')
        }
        footer={null}
        size="lg"
      >
        <CmdbGroupForm
          editing={editing}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setVisible(false);
            setEditing(null);
          }}
          submitting={submitting}
        />
      </AppModal>
      <AppDrawer
        visible={membersDrawer}
        onCancel={() => setMembersDrawer(false)}
        title={
          memberData
            ? `${t('business.cmdb.group.members')} - ${memberData.groupName}`
            : t('business.cmdb.group.members')
        }
        size="lg"
        footer={null}
      >
        {memberData?.members?.length ? (
          <AppTable
            data={memberData.members}
            columns={[
              { title: t('business.cmdb.host.hostname'), dataIndex: 'hostname' },
              { title: t('business.cmdb.host.ip'), dataIndex: 'ip' },
              {
                title: t('business.cmdb.host.status'),
                dataIndex: 'status',
                render: (_, row: any) => (
                  <Tag color={row.status === 'online' ? 'green' : 'gray'}>
                    {t(`business.cmdb.host.status.${row.status}`)}
                  </Tag>
                ),
              },
            ]}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        ) : (
          <div style={{ color: 'var(--text-tertiary)' }}>
            {t('business.cmdb.group.empty')}
          </div>
        )}
      </AppDrawer>
    </PageContainer>
  );
}
