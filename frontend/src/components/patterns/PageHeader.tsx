import React from 'react';
import { Space, Typography } from '@arco-design/web-react';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, extra, className }) => (
  <div className={className ? `page-header ${className}` : 'page-header'}>
    <Space direction="vertical" size={4} className="page-header__meta">
      <Typography.Title heading={5} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
      {subtitle ? (
        <Typography.Text type="secondary">
          {subtitle}
        </Typography.Text>
      ) : null}
    </Space>
    {extra ? <div className="page-header__extra">{extra}</div> : null}
  </div>
);

export default PageHeader;
