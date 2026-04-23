import React from 'react';
import { Button, Result } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

interface PageServerErrorProps {
  description?: React.ReactNode;
  onRetry?: () => void;
}

const PageServerError: React.FC<PageServerErrorProps> = ({ description, onRetry }) => {
  const { t } = useTranslation();

  return (
    <Result
      className="page-result"
      status="500"
      title="500"
      subTitle={description || t('common.serverError')}
      extra={onRetry ? <Button onClick={onRetry}>{t('common.retry')}</Button> : null}
    />
  );
};

export default PageServerError;
