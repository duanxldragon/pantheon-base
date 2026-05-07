import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Message,
  Spin,
} from '@arco-design/web-react';
import { IconLeft, IconCode, IconEdit } from '@arco-design/web-react/icon';
import { PageContainer } from '../../../../components/patterns/PageContainer';
import { PageHeader } from '../../../../components/patterns/PageHeader';
import { FormSection } from '../../../../components/patterns/FormSection';
import { SubmitBar } from '../../../../components/patterns/SubmitBar';
import { getHostDetail, collectHostConfig, HostRow } from './api';
import { usePermission } from '../../../../hooks/usePermission';

const statusColorMap: Record<string, string> = {
  pending: 'gray',
  online: 'green',
  offline: 'red',
  maintenance: 'orange',
};

export default function CmdbHostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasPerm } = usePermission();
  const [searchParams] = useSearchParams();

  const [host, setHost] = useState<HostRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectVisible, setCollectVisible] = useState(searchParams.get('collect') === '1');
  const [collecting, setCollecting] = useState(false);
  const [collectForm] = Form.useForm();

  const canCollect = hasPerm('business:cmdb:host:collect');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getHostDetail(Number(id))
      .then(setHost)
      .finally(() => setLoading(false));
  }, [id]);

  const handleCollect = async () => {
    if (!id) return;
    const values = await collectForm.validate();
    setCollecting(true);
    try {
      const result = await collectHostConfig(Number(id), values);
      setHost(result);
      setCollectVisible(false);
      Message.success(t('business.cmdb.host.collectSuccess'));
    } catch {
      // error handled by interceptor
    } finally {
      setCollecting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Spin loading style={{ display: 'block', padding: 100 }} />
      </PageContainer>
    );
  }

  if (!host) {
    return (
      <PageContainer>
        <PageHeader title={t('business.cmdb.host.detail')} />
        <Card>{t('common.empty')}</Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={host.hostname}
        extra={
          <Space>
            {canCollect && host.os === 'linux' && (
              <Button icon={<IconCode />} onClick={() => setCollectVisible(true)}>
                {t('business.cmdb.host.collect')}
              </Button>
            )}
            <Button icon={<IconLeft />} onClick={() => navigate('/operations/cmdb/host')}>
              {t('common.back')}
            </Button>
          </Space>
        }
      />
      <Space direction="vertical" size={16}>
        <Card>
          <FormSection title={t('common.baseInfo')}>
            <Descriptions
              column={2}
              data={[
                { label: t('business.cmdb.host.hostname'), value: host.hostname },
                { label: t('business.cmdb.host.ip'), value: host.ip },
                { label: t('business.cmdb.host.sshPort'), value: host.sshPort || 22 },
                { label: t('business.cmdb.host.os'), value: host.os },
                { label: t('business.cmdb.host.osVersion'), value: host.osVersion || '-' },
                { label: t('business.cmdb.host.owner'), value: host.owner || '-' },
              ]}
            />
            <Descriptions
              column={1}
              style={{ marginTop: 16 }}
              data={[
                { label: t('business.cmdb.host.remark'), value: host.remark || '-' },
              ]}
            />
          </FormSection>
        </Card>
        <Card>
          <FormSection title={t('business.cmdb.host.labels')}>
            {host.labelValues?.length ? (
              <Space wrap>
                {host.labelValues.map((l, i) => (
                  <Tag key={i}>
                    {l.key}={l.val}
                  </Tag>
                ))}
              </Space>
            ) : (
              <span style={{ color: 'var(--text-tertiary)' }}>{t('common.empty')}</span>
            )}
          </FormSection>
        </Card>
        <Card>
          <FormSection title={t('business.cmdb.host.installedComponents')}>
            {host.installedComponents?.length ? (
              <Space wrap>
                {host.installedComponents.map((c, i) => (
                  <Tag key={i} color="arcoblue">
                    {c.name} {c.version}
                  </Tag>
                ))}
              </Space>
            ) : (
              <span style={{ color: 'var(--text-tertiary)' }}>{t('common.empty')}</span>
            )}
          </FormSection>
        </Card>
      </Space>
      <Modal
        visible={collectVisible}
        onCancel={() => setCollectVisible(false)}
        title={t('business.cmdb.collect.modalTitle')}
        footer={null}
      >
        <Form form={collectForm} layout="vertical" onSubmit={handleCollect}>
          <Form.Item
            label={t('business.cmdb.host.collectSshUser')}
            field="sshUser"
            rules={[{ required: true }]}
          >
            <Input placeholder="root" />
          </Form.Item>
          <Form.Item
            label={t('business.cmdb.host.collectAuthMode')}
            field="authMode"
            rules={[{ required: true }]}
            initialValue="password"
          >
            <Select>
              <Select.Option value="password">
                {t('business.cmdb.collect.authMode.password')}
              </Select.Option>
              <Select.Option value="private_key">
                {t('business.cmdb.collect.authMode.privateKey')}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, next) => prev.authMode !== next.authMode}>
            {(values) =>
              values.authMode === 'private_key' ? (
                <Form.Item
                  label={t('business.cmdb.host.collectPrivateKey')}
                  field="sshPrivateKey"
                  rules={[{ required: true }]}
                >
                  <Input.TextArea rows={4} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" />
                </Form.Item>
              ) : (
                <Form.Item
                  label={t('business.cmdb.host.collectPassword')}
                  field="sshPassword"
                  rules={[{ required: true }]}
                >
                  <Input.Password />
                </Form.Item>
              )
            }
          </Form.Item>
          <div style={{ color: 'var(--text-tertiary)', marginBottom: 16 }}>
            {t('business.cmdb.collect.hint')}
          </div>
          <SubmitBar
            onCancel={() => setCollectVisible(false)}
            loading={collecting}
            submitText={t('business.cmdb.collect.start')}
          />
        </Form>
      </Modal>
    </PageContainer>
  );
}
