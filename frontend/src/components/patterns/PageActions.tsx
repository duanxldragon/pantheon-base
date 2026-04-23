import React from 'react';
import { Space } from '@arco-design/web-react';

interface PageActionsProps {
  children: React.ReactNode;
}

const PageActions: React.FC<PageActionsProps> = ({ children }) => (
  <Space size={10} className="page-actions">
    {children}
  </Space>
);

export default PageActions;
