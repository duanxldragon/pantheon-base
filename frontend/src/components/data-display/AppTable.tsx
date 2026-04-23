import React from 'react';
import { Table } from '@arco-design/web-react';
import type { TableProps } from '@arco-design/web-react/es/Table/interface';
import PageEmpty from '../feedback/PageEmpty';

interface AppTableProps<T> extends TableProps<T> {
  emptyText?: React.ReactNode;
}

function AppTable<T>(props: AppTableProps<T>) {
  const { data, loading, emptyText, ...rest } = props;
  const rows = Array.isArray(data) ? data : [];

  if (!loading && rows.length === 0) {
    return <PageEmpty description={emptyText} />;
  }

  return (
    <Table
      {...rest}
      className={rest.className ? `app-table ${rest.className}` : 'app-table'}
      size={rest.size || 'small'}
      data={rows}
      loading={loading}
    />
  );
}

export default AppTable;
