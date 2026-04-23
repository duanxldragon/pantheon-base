import React, { useMemo, useState } from 'react';
import { Alert, Button, Form, Input, Message, Space, Tag, Tooltip, Typography } from '@arco-design/web-react';
import { IconCheckCircle, IconLanguage, IconLock, IconSafe, IconStorage, IconUser } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login, type LoginPayload, type LoginResp } from './api';
import { useAuthStore } from '../../store/useAuthStore';
import { useMenuStore } from '../../store/useMenuStore';
import ThemeSwitcher from '../../core/theme/ThemeSwitcher';
import { clearShellSessionState } from '../../core/shellState';
import './Login.css';

const FormItem = Form.Item;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { setTokens, setUserInfo } = useAuthStore();
  const { resetMenuTree } = useMenuStore();
  const currentLang = i18n.language === 'en-US' ? 'en-US' : 'zh-CN';
  const nextLang = currentLang === 'zh-CN' ? 'en-US' : 'zh-CN';
  const featureItems = useMemo(() => [
    { icon: <IconCheckCircle />, label: t('auth.login.feature.modules') },
    { icon: <IconSafe />, label: t('auth.login.feature.security') },
    { icon: <IconStorage />, label: t('auth.login.feature.i18n') },
  ], [t]);
  const assuranceItems = useMemo(() => [
    { key: 'boundary', title: t('auth.login.assurance.boundary'), desc: t('auth.login.assurance.boundaryDesc') },
    { key: 'session', title: t('auth.login.assurance.session'), desc: t('auth.login.assurance.sessionDesc') },
    { key: 'audit', title: t('auth.login.assurance.audit'), desc: t('auth.login.assurance.auditDesc') },
  ], [t]);

  const onSubmit = async (values: LoginPayload) => {
    setLoading(true);
    try {
      const res: LoginResp = await login(values);
      clearShellSessionState();
      resetMenuTree();
      setTokens(res.accessToken, res.refreshToken);
      setUserInfo(res.user);
      Message.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    localStorage.setItem('pantheon_lang', nextLang);
    void i18n.changeLanguage(nextLang);
  };

  return (
    <div className="auth-login-page">
      <section className="auth-login-page__brand-pane">
        <div className="auth-login-page__brand-inner">
          <div className="auth-login-page__brand">
            <div className="auth-login-page__brand-mark">P</div>
            <div className="auth-login-page__brand-copy">
              <span className="auth-login-page__brand-title">{t('app.name')}</span>
              <span className="auth-login-page__brand-subtitle">{t('auth.login.consoleLabel')}</span>
            </div>
          </div>

          <div className="auth-login-page__intro">
            <Tag color="arcoblue" bordered={false} className="auth-login-page__tag">
              {t('auth.login.entryTag')}
            </Tag>
            <Typography.Title heading={2} className="auth-login-page__headline">
              {t('auth.login.visualTitle')}
            </Typography.Title>
            <Typography.Paragraph className="auth-login-page__description">
              {t('auth.login.visualDesc')}
            </Typography.Paragraph>
          </div>

          <Space wrap className="auth-login-page__features">
            {featureItems.map((item) => (
              <Tag key={item.label} bordered={false} color="gray" icon={item.icon}>
                {item.label}
              </Tag>
            ))}
          </Space>

          <div className="auth-login-assurance">
            <div className="auth-login-assurance__header">
              <span>{t('auth.login.assurance.title')}</span>
              <Tag bordered={false} color="green">{t('auth.login.visualBadge')}</Tag>
            </div>
            <div className="auth-login-assurance__list">
              {assuranceItems.map((item) => (
                <div className="auth-login-assurance__item" key={item.key}>
                  <span className="auth-login-assurance__dot" />
                  <span className="auth-login-assurance__copy">
                    <span className="auth-login-assurance__title">{item.title}</span>
                    <span className="auth-login-assurance__desc">{item.desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-login-page__footer">{t('app.footer')}</div>
        </div>
      </section>

      <section className="auth-login-page__form-pane" aria-label={t('auth.login.visualAria')}>
        <div className="auth-login-page__tools">
          <ThemeSwitcher className="auth-login-page__tool-btn" />
          <Tooltip content={t('app.toggleLanguage')}>
            <Button type="text" className="auth-login-page__tool-btn" icon={<IconLanguage />} onClick={toggleLanguage}>
              {t(`app.language.${nextLang}`)}
            </Button>
          </Tooltip>
        </div>

        <div className="auth-login-card">
          <div className="auth-login-card__header">
            <Tag color="arcoblue" bordered={false} className="auth-login-card__tag">
              {t('auth.login.consoleTitle')}
            </Tag>
            <Typography.Title heading={3} className="auth-login-card__title">
              {t('auth.login.title')}
            </Typography.Title>
            <Typography.Paragraph className="auth-login-card__subtitle">
              {t('auth.login.subtitle')}
            </Typography.Paragraph>
          </div>

          <Alert className="auth-login-card__notice" type="info" content={t('auth.login.securityNotice')} />

          <Form layout="vertical" onSubmit={onSubmit}>
            <FormItem label={t('auth.username')} field="username" rules={[{ required: true, message: t('auth.usernameRequired') }]}>
              <Input prefix={<IconUser />} placeholder={t('auth.usernamePlaceholder')} size="large" />
            </FormItem>
            <FormItem label={t('auth.password')} field="password" rules={[{ required: true, message: t('auth.passwordRequired') }]}>
              <Input.Password prefix={<IconLock />} placeholder={t('auth.passwordPlaceholder')} size="large" />
            </FormItem>
            <Button type="primary" htmlType="submit" long loading={loading} className="auth-login-card__submit">
              {t('auth.signIn')}
            </Button>
          </Form>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
