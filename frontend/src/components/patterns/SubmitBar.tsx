import React from 'react';
import { Button, Space } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

interface SubmitBarProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  loading?: boolean;
  submitText?: React.ReactNode;
  cancelText?: React.ReactNode;
}

const SubmitBar: React.FC<SubmitBarProps> = ({
  onCancel,
  onSubmit,
  loading,
  submitText,
  cancelText,
}) => {
  const { t } = useTranslation();

  return (
    <div className="submit-bar">
      <Space size={10}>
        <Button onClick={onCancel}>
          {cancelText || t('common.cancel')}
        </Button>
        <Button type="primary" loading={loading} onClick={onSubmit}>
          {submitText || t('common.save')}
        </Button>
      </Space>
    </div>
  );
};

export default SubmitBar;
