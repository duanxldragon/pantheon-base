import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Descriptions, Form, Grid, Input, Message, Popconfirm, Select, Space, Tag, Typography } from '@arco-design/web-react';
import type { ColumnProps } from '@arco-design/web-react/es/Table/interface';
import { IconArrowRight, IconDelete, IconLink, IconPlus } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { AppModal, AppTable, FormSection, PageActions, PageContainer, PageEmpty, PageError, PageHeader, PageLoading, SubmitBar } from '../../../components';
import { formatDateTime } from '../../../core/format/dateTime';
import { usePermission } from '../../../hooks/usePermission';
import {
  createCMDBRelation,
  deleteCMDBRelation,
  getCMDBDictOptions,
  getCMDBItemDetail,
  getCMDBItemList,
  type CMDBItemDetail,
  type CMDBItemRow,
  type CMDBRelationPayload,
  type CMDBRelationRow,
  type DictOptionItem,
} from './api';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const defaultRelationOptions: DictOptionItem[] = [
  { labelKey: 'cmdb.relation.depends_on', value: 'depends_on', color: 'arcoblue', sort: 1 },
  { labelKey: 'cmdb.relation.deployed_on', value: 'deployed_on', color: 'purple', sort: 2 },
  { labelKey: 'cmdb.relation.connects_to', value: 'connects_to', color: 'green', sort: 3 },
  { labelKey: 'cmdb.relation.backed_by', value: 'backed_by', color: 'orange', sort: 4 },
];

const emptyRelationForm: CMDBRelationPayload = {
  sourceItemId: 0,
  targetItemId: 0,
  relationType: 'depends_on',
  remark: '',
};

const CMDBItemDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAdmin, hasPerm } = usePermission();
  const canCreateRelation = isAdmin || hasPerm('business:cmdb:relation:create');
  const canDeleteRelation = isAdmin || hasPerm('business:cmdb:relation:delete');
  const [detail, setDetail] = useState<CMDBItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [relationOptions, setRelationOptions] = useState<DictOptionItem[]>(defaultRelationOptions);
  const [itemOptions, setItemOptions] = useState<CMDBItemRow[]>([]);
  const [relationVisible, setRelationVisible] = useState(false);
  const [relationSubmitting, setRelationSubmitting] = useState(false);
  const [relationForm] = Form.useForm<CMDBRelationPayload>();

  const itemId = useMemo(() => Number(id), [id]);
  const invalidItemId = !Number.isInteger(itemId) || itemId <= 0;

  const relationMetaMap = useMemo(() => new Map(relationOptions.map((item) => [item.value, item])), [relationOptions]);
  const itemSelectOptions = useMemo(
    () => itemOptions
      .filter((item) => item.id !== itemId)
      .map((item) => ({ label: `${item.itemName} · ${item.itemCode}`, value: item.id })),
    [itemId, itemOptions],
  );

  const loadDetail = useCallback(async () => {
    if (invalidItemId) {
      setDetail(null);
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const result = await getCMDBItemDetail(itemId);
      setDetail(result);
    } catch {
      setDetail(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [invalidItemId, itemId]);

  const loadRelationContext = useCallback(async () => {
    try {
      const [itemPage, dictMap] = await Promise.all([
        getCMDBItemList({ page: 1, pageSize: 100 }),
        getCMDBDictOptions(['cmdb_relation_type']),
      ]);
      setItemOptions(itemPage.items);
      const dictOptions = dictMap.cmdb_relation_type;
      if (dictOptions?.length) {
        setRelationOptions(dictOptions);
      }
    } catch {
      setRelationOptions(defaultRelationOptions);
    }
  }, []);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    void loadRelationContext();
  }, [loadRelationContext]);

  const relationLabel = useCallback((value: string) => {
    const meta = relationMetaMap.get(value);
    return t(meta?.labelKey || value, { defaultValue: value });
  }, [relationMetaMap, t]);

  const relationColor = useCallback((value: string) => relationMetaMap.get(value)?.color || 'arcoblue', [relationMetaMap]);

  const openCreateRelation = () => {
    relationForm.setFieldsValue({
      ...emptyRelationForm,
      sourceItemId: itemId,
      targetItemId: itemSelectOptions[0]?.value || 0,
    });
    setRelationVisible(true);
  };

  const submitCreateRelation = async () => {
    const values = await relationForm.validate();
    setRelationSubmitting(true);
    try {
      await createCMDBRelation({
        ...values,
        sourceItemId: itemId,
      });
      Message.success(t('common.createSuccess'));
      setRelationVisible(false);
      await loadDetail();
    } finally {
      setRelationSubmitting(false);
    }
  };

  const removeRelation = async (relationId: number) => {
    await deleteCMDBRelation(relationId);
    Message.success(t('common.deleteSuccess'));
    await loadDetail();
  };

  const openRelatedItem = (nextItemId: number) => {
    navigate(`/business/cmdb/items/${nextItemId}`);
  };

  const relationColumns = (direction: 'outgoing' | 'incoming'): ColumnProps<CMDBRelationRow>[] => [
    {
      title: t('cmdb.relation.type'),
      dataIndex: 'relationType',
      width: 160,
      render: (value: string) => <Tag color={relationColor(value)}>{relationLabel(value)}</Tag>,
    },
    direction === 'outgoing'
      ? {
          title: t('cmdb.relation.target'),
          dataIndex: 'targetItemName',
          render: (_: string, row: CMDBRelationRow) => (
            <Space direction="vertical" size={2}>
              <Typography.Text>{row.targetItemName || '-'}</Typography.Text>
              <Typography.Text type="secondary">{row.targetItemCode || '-'}</Typography.Text>
            </Space>
          ),
        }
      : {
          title: t('cmdb.relation.source'),
          dataIndex: 'sourceItemName',
          render: (_: string, row: CMDBRelationRow) => (
            <Space direction="vertical" size={2}>
              <Typography.Text>{row.sourceItemName || '-'}</Typography.Text>
              <Typography.Text type="secondary">{row.sourceItemCode || '-'}</Typography.Text>
            </Space>
          ),
        },
    {
      title: t('system.post.remark'),
      dataIndex: 'remark',
      render: (value: string) => value || '-',
    },
    {
      title: t('system.user.updatedAt'),
      dataIndex: 'updatedAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('common.action'),
      width: 180,
      render: (_: unknown, row: CMDBRelationRow) => (
        <Space>
          <Button
            size="mini"
            type="text"
            icon={<IconArrowRight />}
            onClick={() => openRelatedItem(direction === 'outgoing' ? row.targetItemId : row.sourceItemId)}
          >
            {t('cmdb.relation.openItem')}
          </Button>
          {canDeleteRelation ? (
            <Popconfirm title={t('common.deleteConfirm')} onOk={() => { void removeRelation(row.id); }}>
              <Button size="mini" type="text" status="danger" icon={<IconDelete />}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  if (loading) {
    return <PageLoading />;
  }

  if (invalidItemId) {
    return <PageEmpty description={t('cmdb.item.detailInvalid')} />;
  }

  if (error) {
    return <PageError onRetry={() => { void loadDetail(); }} />;
  }

  if (!detail) {
    return <PageEmpty description={t('common.noData')} />;
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('cmdb.item.detail')}
        subtitle={t('cmdb.item.detailSubtitle')}
        extra={(
          <PageActions>
            {canCreateRelation ? (
              <Button type="primary" icon={<IconPlus />} onClick={openCreateRelation}>
                {t('cmdb.relation.create')}
              </Button>
            ) : null}
            <Button onClick={() => navigate('/business/cmdb/items')}>{t('common.back')}</Button>
          </PageActions>
        )}
      />

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Space size={16} align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space direction="vertical" size={4}>
              <Typography.Title heading={5} style={{ margin: 0 }}>
                {detail.itemName}
              </Typography.Title>
              <Typography.Text type="secondary">{detail.itemCode}</Typography.Text>
            </Space>
            <Space>
              <Tag>{detail.typeName || '-'}</Tag>
              <Tag>{t(`cmdb.environment.${detail.environment}`, detail.environment)}</Tag>
              <Tag color={detail.status === 'active' ? 'green' : detail.status === 'maintenance' ? 'orange' : 'gray'}>
                {t(`cmdb.status.${detail.status}`, detail.status)}
              </Tag>
            </Space>
          </Space>
        </Card>

        <Row gutter={16}>
          <Col span={12}>
            <Card title={t('common.basicInfo')}>
              <Descriptions
                column={1}
                data={[
                  { label: t('cmdb.item.type'), value: detail.typeName || '-' },
                  { label: t('cmdb.item.code'), value: detail.itemCode || '-' },
                  { label: t('cmdb.item.name'), value: detail.itemName || '-' },
                  { label: t('cmdb.item.endpoint'), value: detail.endpoint || '-' },
                  { label: t('cmdb.item.description'), value: detail.description || '-' },
                ]}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title={t('cmdb.item.summary')}>
              <Descriptions
                column={1}
                data={[
                  { label: t('cmdb.item.environment'), value: t(`cmdb.environment.${detail.environment}`, detail.environment) },
                  { label: t('cmdb.item.status'), value: t(`cmdb.status.${detail.status}`, detail.status) },
                  { label: t('system.user.dept'), value: detail.ownerDeptName || detail.ownerDeptId || '-' },
                  { label: t('cmdb.item.ownerUserId'), value: detail.ownerUserId || '-' },
                  { label: t('system.user.createdAt'), value: formatDateTime(detail.createdAt) },
                  { label: t('system.user.updatedAt'), value: formatDateTime(detail.updatedAt) },
                ]}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title={(
            <Space>
              <IconLink />
              <span>{t('cmdb.relation.outgoingTitle')}</span>
              <Tag>{detail.outgoingRelations.length}</Tag>
            </Space>
          )}
        >
          {detail.outgoingRelations.length === 0 ? (
            <PageEmpty description={t('cmdb.relation.emptyOutgoing')} />
          ) : (
            <AppTable<CMDBRelationRow>
              rowKey="id"
              data={detail.outgoingRelations}
              columns={relationColumns('outgoing')}
              pagination={false}
            />
          )}
        </Card>

        <Card
          title={(
            <Space>
              <IconLink />
              <span>{t('cmdb.relation.incomingTitle')}</span>
              <Tag>{detail.incomingRelations.length}</Tag>
            </Space>
          )}
        >
          {detail.incomingRelations.length === 0 ? (
            <PageEmpty description={t('cmdb.relation.emptyIncoming')} />
          ) : (
            <AppTable<CMDBRelationRow>
              rowKey="id"
              data={detail.incomingRelations}
              columns={relationColumns('incoming')}
              pagination={false}
            />
          )}
        </Card>
      </Space>

      <AppModal
        visible={relationVisible}
        title={t('cmdb.relation.create')}
        footer={null}
        onCancel={() => setRelationVisible(false)}
      >
        <Form form={relationForm} layout="vertical">
          <FormSection title={t('cmdb.relation.formTitle')}>
            <FormItem label={t('cmdb.relation.source')} field="sourceItemId">
              <Input value={`${detail.itemName} · ${detail.itemCode}`} disabled />
            </FormItem>
            <FormItem
              label={t('cmdb.relation.target')}
              field="targetItemId"
              rules={[{ required: true, message: t('cmdb.relation.targetRequired') }]}
            >
              <Select showSearch options={itemSelectOptions} />
            </FormItem>
            <FormItem
              label={t('cmdb.relation.type')}
              field="relationType"
              rules={[{ required: true, message: t('cmdb.relation.typeRequired') }]}
            >
              <Select options={relationOptions.map((item) => ({ label: t(item.labelKey, { defaultValue: item.value }), value: item.value }))} />
            </FormItem>
            <FormItem label={t('system.post.remark')} field="remark">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} />
            </FormItem>
          </FormSection>
          <SubmitBar loading={relationSubmitting} onCancel={() => setRelationVisible(false)} onSubmit={() => { void submitCreateRelation(); }} />
        </Form>
      </AppModal>
    </PageContainer>
  );
};

export default CMDBItemDetailPage;
