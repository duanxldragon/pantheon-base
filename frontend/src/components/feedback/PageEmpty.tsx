import React from 'react';
import { Empty } from '@arco-design/web-react';

interface PageEmptyProps {
  description?: React.ReactNode;
}

const PageEmpty: React.FC<PageEmptyProps> = ({ description }) => (
  <div className="page-empty">
    <Empty className="page-empty__inner" description={description} />
  </div>
);

export default PageEmpty;
