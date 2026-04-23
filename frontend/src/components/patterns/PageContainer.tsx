import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className }) => (
  <div className={className ? `page-container ${className}` : 'page-container'}>
    {children}
  </div>
);

export default PageContainer;
