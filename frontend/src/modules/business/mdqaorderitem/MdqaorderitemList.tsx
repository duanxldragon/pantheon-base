import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Tag, Popconfirm, Button, Form, Grid, Input, Select, Card, Space } from '@arco-design/web-react';
import { IconDelete, IconDownload, IconEye, IconPlus, IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { message } from '../../../components/feedback/message';
import {
  deleteMdqaorderitem ,
  getMdqaorderitemList,
  type MdqaorderitemListQuery,
  type MdqaorderitemListRow,
} from './api';
import {
  AppTable,
  FilterPanel,
  GovernanceSummaryBar,
  ImportCsvButton,
  ListHeaderActions,
  PageContainer,
  PageEmpty,
  PageError,
  PageLoading,
  SystemRowActions,
  TableBatchActionBar,
  TABLE_ACTION_COLUMN_WIDTH,
  buildStandardPagination,
} from '../../../components';
import '../../../modules/system/list-page.css';

const governanceTableRole = 'detail';
const governancePrimaryTable = 'biz_mdqa_order';
const governanceRelationFromField = 'orderId';
const governanceRelationToField = 'id';



const FormItem = Form.Item;
const { Row, Col } = Grid;

const emptyQuery: MdqaorderitemListQuery = {
  itemName: '',
  orderId: 0,
  page: 1,
  pageSize: 20,
};

const MdqaorderitemList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MdqaorderitemListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState<MdqaorderitemListQuery>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [queryForm] = Form.useForm<MdqaorderitemListQuery>();
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

  const search = () => {
    const values = queryForm.getFieldsValue();
    setSelectedRowKeys([]);
    const nextQuery = {
      ...query,
      ...values,
      page: 1,
    };
    setQuery(nextQuery);
    void loadData(nextQuery);
  };

  const reset = () => {
    queryForm.setFieldsValue(emptyQuery);
    setSelectedRowKeys([]);
    setQuery(emptyQuery);
    void loadData(emptyQuery);
  };

  const handleExport = async () => {
    message.info(t('common.comingSoon'));
  };

  const handleImport = async (file: File) => {
    void file;
    await loadData(query);
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      return;
    }
    setSubmitting(true);
    try {
      await Promise.all(selectedRowKeys.map((rowKey) => deleteMdqaorderitem(Number(rowKey))));
      message.success(t('common.deleteSuccess'));
      setSelectedRowKeys([]);
      await loadData(query);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && data.length === 0) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError onRetry={() => { void loadData(); }} />;
  }

  return (
    <PageContainer>
      <Space direction="vertical" size={16} className="system-page-template">
        <GovernanceSummaryBar
          eyebrow={t('generator.wizard.listLayout.governance', 'Governance')}
          title={t('business.mdqaorderitem.title')}
          description={t('generator.wizard.relationFields.help')}
          metrics={[
            {
              key: 'tableRole',
              label: t('generator.wizard.tableRole'),
              value: t(`generator.wizard.tableRole.${governanceTableRole}`),
            },
            {
              key: 'primaryTable',
              label: t('generator.wizard.primaryTable'),
              value: governancePrimaryTable || '-',
            },
          ]}
        />
        <FilterPanel>
          <Form form={queryForm} layout="vertical" onSubmit={() => search()}>
            <Row gutter={16}>
              <Col xs={24} md={6}>
                <FormItem label={t('business.mdqaorderitem.field.itemName.label')} field="itemName">
                  <Input onPressEnter={() => queryForm.submit()} />
                </FormItem>
              </Col>
              <Col xs={24} md={6}>
                <FormItem label={t('business.mdqaorderitem.field.orderId.label')} field="orderId">
                  <Input onPressEnter={() => queryForm.submit()} />
                </FormItem>
              </Col>
              <Col xs={24} md={6}>
                <FormItem className="filter-panel__action-item">
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<IconSearch />}>
                      {t('common.search')}
                    </Button>
                    <Button onClick={reset}>{t('common.reset')}</Button>
                  </Space>
                </FormItem>
              </Col>
            </Row>
          </Form>
        </FilterPanel>
        <TableBatchActionBar
            selectedCount={selectedRowKeys.length}
            selectedText={t('common.selectedCount', { count: selectedRowKeys.length })}
            clearText={t('common.clearSelection')}
            clearSuccessText={t('common.clearSelectionSuccess')}
            onClear={() => setSelectedRowKeys([])}
            prefixActions={
              <ListHeaderActions
                utility={
                  <>

                  </>
                }
                primary={
                  <>
                  <Button
                    type="primary"
                    icon={<IconPlus />}
                    onClick={() => {
                      message.info(t('common.comingSoon'));
                    }}
                  >
                    {t('common.add')}
                  </Button>
                  </>
                }
              />
            }
            actions={
              <Popconfirm
                title={t('common.deleteConfirm')}
                onOk={() => {
                  void handleBatchDelete();
                }}
                disabled={selectedRowKeys.length === 0 || submitting}
              >
                <Button
                  status="danger"
                  icon={<IconDelete />}
                  disabled={selectedRowKeys.length === 0 || submitting}
                  loading={submitting}
                >
                  {t('common.deleteSelected')}
                </Button>
              </Popconfirm>
            }
          />
        <Card className="page-panel system-list__table-card">
          {loading && data.length === 0 ? <PageLoading /> : null}
          {error && data.length === 0 ? (
            <PageError
              onRetry={() => {
                void loadData(query);
              }}
            />
          ) : null}
          {!loading && !error && data.length === 0 ? (
            <PageEmpty description={t('common.noData')} />
          ) : null}
          {!loading && !(error && data.length === 0) && data.length > 0 ? (
            <AppTable
              className="system-list__table"
              data={data}
              rowKey="id"
              scroll={{ x: 'max-content' }}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                checkCrossPage: true,
                preserveSelectedRowKeys: true,
                fixed: true,
                onChange: (rowKeys) => setSelectedRowKeys(rowKeys),
              }}
              pagination={buildStandardPagination(t, {
                current: query.page,
                pageSize: query.pageSize,
                total,
                onChange: (page, pageSize) => {
                  const nextQuery = { ...query, page, pageSize };
                  setQuery(nextQuery);
                  void loadData(nextQuery);
                },
              })}
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
                {
                  title: t('common.action'),
                  width: TABLE_ACTION_COLUMN_WIDTH.medium,
                  fixed: 'right',
                  render: (_: unknown, row: MdqaorderitemListRow) => (
                    <SystemRowActions
                      actions={[
                        {
                          key: 'detail',
                          text: t('common.detail'),
                          icon: <IconEye />,
                          onClick: () => navigate('/operations/mdqaorderitem/' + row.id),
                        },
                        {
                          key: 'delete',
                          text: t('common.delete'),
                          icon: <IconDelete />,
                          status: 'danger',
                          confirm: {
                            title: t('common.deleteConfirm'),
                            onOk: async () => {
                              await deleteMdqaorderitem(row.id);
                              message.success(t('common.deleteSuccess'));
                              await loadData(query);
                            },
                          },
                        },
                      ]}
                    />
                  ),
                },
              ]}
            />
          ) : null}
        </Card>
      </Space>
    </PageContainer>
  );
};

export default MdqaorderitemList;
