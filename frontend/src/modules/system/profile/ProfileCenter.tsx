import React, { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Grid,
  Input,
  Message,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconLock, IconUser } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getProfile, updateProfile, type UserProfile, type UserProfileUpdatePayload } from '../user/api';
import { formatDateTime } from '../../../core/format/dateTime';
import { useAuthStore } from '../../../store/useAuthStore';
import { FormSection, PageContainer, PageHeader, PageLoading, SubmitBar } from '../../../components';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const ProfileCenter: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUserInfo } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm] = Form.useForm<UserProfileUpdatePayload>();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProfile();
      setProfile(result);
      profileForm.setFieldsValue({
        nickname: result.nickname || '',
        avatar: result.avatar || '',
        email: result.email || '',
        phone: result.phone || '',
      });
      setUserInfo({
        id: result.id,
        username: result.username,
        nickname: result.nickname,
        avatar: result.avatar,
        email: result.email,
        phone: result.phone,
        roles: result.roles,
        perms: result.perms,
      });
    } catch {
      Message.error(t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [profileForm, setUserInfo, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  const handleSaveProfile = async () => {
    const values = await profileForm.validate();
    setSavingProfile(true);
    try {
      const result = await updateProfile(values);
      setProfile(result);
      setUserInfo({
        id: result.id,
        username: result.username,
        nickname: result.nickname,
        avatar: result.avatar,
        email: result.email,
        phone: result.phone,
        roles: result.roles,
        perms: result.perms,
      });
      Message.success(t('common.updateSuccess'));
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading && !profile) {
    return <PageLoading />;
  }

  return (
    <PageContainer>
      <PageHeader title={t('system.profile.title')} />
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card className="page-panel page-panel--soft">
          <Row gutter={24} align="center">
            <Col span={16}>
              <Space align="start" size={16}>
                <Avatar size={56}>
                  {profile?.nickname?.[0] || profile?.username?.[0] || 'U'}
                </Avatar>
                <Space direction="vertical" size={4}>
                  <Typography.Title heading={5} style={{ margin: 0 }}>
                    {profile?.nickname || profile?.username || t('system.profile.title')}
                  </Typography.Title>
                  <Typography.Text type="secondary">{profile?.username}</Typography.Text>
                  <Space wrap>
                    {profile?.roles?.map((role) => (
                      <Tag key={role} color="arcoblue">{role}</Tag>
                    ))}
                  </Space>
                </Space>
              </Space>
            </Col>
            <Col span={8}>
              <Descriptions
                colon=" : "
                column={1}
                data={[
                  { label: t('system.profile.email'), value: profile?.email || '-' },
                  { label: t('system.profile.phone'), value: profile?.phone || '-' },
                  { label: t('system.profile.createdAt'), value: formatDateTime(profile?.createdAt) },
                ]}
              />
            </Col>
          </Row>
        </Card>

        <Card className="page-panel" title={t('system.profile.basicTitle')}>
          <Form form={profileForm} layout="vertical">
            <FormSection title={t('common.basicInfo')}>
              <Row gutter={16}>
                <Col span={12}>
                  <FormItem label={t('system.profile.username')}>
                    <Input value={profile?.username || ''} disabled prefix={<IconUser />} />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem label={t('system.profile.nickname')} field="nickname" rules={[{ required: true, message: t('system.profile.nicknameRequired') }]}>
                    <Input />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem label={t('system.profile.email')} field="email" rules={[{ match: /\S+@\S+\.\S+/, message: t('system.user.email.invalid') }]}>
                    <Input />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem label={t('system.profile.phone')} field="phone">
                    <Input />
                  </FormItem>
                </Col>
                <Col span={24}>
                  <FormItem label={t('system.profile.avatar')} field="avatar">
                    <Input placeholder={t('system.profile.avatarPlaceholder')} />
                  </FormItem>
                </Col>
              </Row>
            </FormSection>
            <SubmitBar
              onSubmit={() => { void handleSaveProfile(); }}
              loading={savingProfile}
              submitText={t('system.profile.saveProfile')}
            />
          </Form>
        </Card>

        <Card className="page-panel" title={t('system.profile.securityTab')}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {t('system.profile.passwordHint')}
            </Typography.Paragraph>
            <Button
              type="outline"
              icon={<IconLock />}
              onClick={() => navigate('/auth/security')}
            >
              {t('auth.security.title')}
            </Button>
          </Space>
        </Card>
      </Space>
    </PageContainer>
  );
};

export default ProfileCenter;
