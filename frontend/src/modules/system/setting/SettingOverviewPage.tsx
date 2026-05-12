import React from 'react';
import { Card, Space, Tag, Typography } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  PageContainer,
  PageEmpty,
  PageError,
  PageHeader,
  PageLoading,
  PageNetworkError,
  PageServerError,
} from '../../../components';
import {
  isNetworkRequestError,
  isServerRequestError,
  isTimeoutRequestError,
} from '../../../api/request';
import { resolveSettingGroupMeta } from './settingGroups';
import { useSettingCatalog } from './useSettingCatalog';
import '../list-page.css';

const SettingOverviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { loading, error, overview, groupedSettings, reload } = useSettingCatalog();

  const renderErrorState = () => {
    if (isNetworkRequestError(error)) {
      return (
        <PageNetworkError
          timeout={isTimeoutRequestError(error)}
          onRetry={() => {
            void reload();
          }}
        />
      );
    }
    if (isServerRequestError(error)) {
      return (
        <PageServerError
          onRetry={() => {
            void reload();
          }}
        />
      );
    }
    return (
      <PageError
        onRetry={() => {
          void reload();
        }}
      />
    );
  };

  const heroStats = overview
    ? [
        {
          key: 'total',
          label: t('system.setting.overview.totalSettings'),
          value: overview.totalSettingCount,
          hint: t('system.setting.hero.totalHint'),
        },
        {
          key: 'public',
          label: t('system.setting.overview.publicSettings'),
          value: overview.publicSettingCount,
          hint: t('system.setting.hero.publicHint'),
        },
        {
          key: 'encrypted',
          label: t('system.setting.overview.encryptedSettings'),
          value: overview.encryptedSettingCount,
          hint: t('system.setting.hero.encryptedHint'),
        },
        {
          key: 'risk',
          label: t('system.setting.overview.risks'),
          value: overview.riskCount,
          hint: t('system.setting.hero.riskHint'),
        },
      ]
    : [];

  return (
    <PageContainer>
      <PageHeader title={t('system.menu.setting')} />
      <Space direction="vertical" size={12} className="system-page-template setting-page setting-overview-page">
        {overview ? (
          <Card className="page-panel system-page-hero system-list__hero setting-page__hero">
            <div className="system-page-hero__top">
              <div className="system-page-hero__copy">
                <span className="system-page-hero__eyebrow">{t('system.setting.hero.eyebrow')}</span>
                <Typography.Title heading={5} className="system-page-hero__title">
                  {t('system.setting.hero.title')}
                </Typography.Title>
                <Typography.Paragraph type="secondary" className="system-page-hero__desc">
                  {t('system.setting.hero.desc')}
                </Typography.Paragraph>
              </div>
            </div>
            <div className="system-page-kpi-grid">
              {heroStats.map((item) => (
                <div key={item.key} className="system-page-kpi">
                  <span className="system-page-kpi__label">{item.label}</span>
                  <span className="system-page-kpi__value">{item.value}</span>
                  <span className="system-page-kpi__hint">{item.hint}</span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
        {loading && groupedSettings.length === 0 ? <PageLoading /> : null}
        {error && groupedSettings.length === 0 ? renderErrorState() : null}
        {!loading && !error && groupedSettings.length === 0 ? (
          <PageEmpty description={t('system.setting.empty')} />
        ) : null}
        {groupedSettings.length > 0 ? (
          <div className="setting-overview-page__group-grid">
            {groupedSettings.map((group) => {
              const meta = resolveSettingGroupMeta(group.groupKey);
              const issueCount =
                overview?.issues.filter((issue) => issue.groupKey === group.groupKey).length || 0;
              return (
                <Card
                  key={group.groupKey}
                  className="page-panel setting-overview-page__group-card"
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space align="center" wrap>
                      <Typography.Title heading={6} style={{ margin: 0 }}>
                        {t(meta.titleKey)}
                      </Typography.Title>
                      {issueCount > 0 ? (
                        <Tag color={meta.tone === 'danger' ? 'red' : 'orange'}>
                          {t('common.total', { count: issueCount })}
                        </Tag>
                      ) : null}
                    </Space>
                    <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                      {t(meta.descriptionKey, '')}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary">
                      {t('common.total', { count: group.items.length })}
                    </Typography.Text>
                    <Link to={meta.path}>{t(meta.titleKey)}</Link>
                  </Space>
                </Card>
              );
            })}
          </div>
        ) : null}
      </Space>
    </PageContainer>
  );
};

export default SettingOverviewPage;
