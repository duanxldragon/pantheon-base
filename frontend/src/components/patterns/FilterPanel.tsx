import React from 'react';
import { Card } from '@arco-design/web-react';

interface FilterPanelProps {
  children: React.ReactNode;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ children }) => (
  <Card className="filter-panel" bodyStyle={{ paddingBottom: 4 }}>
    {children}
  </Card>
);

export default FilterPanel;
