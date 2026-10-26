import React from 'react';
import { Typography } from '@arco-design/web-react';
import { formatQuotaLimit, isUnlimitedQuota } from './quota';
import './QuotaRatio.css';

/**
 * Usage against a plan ceiling, the one shape both tenant-ops pages report.
 *
 * Exceeding a ceiling is highlighted because the platform console reports
 * occupancy without enforcing it: quota is a measurement, not a write gate
 * (TENANT_CONTRACT_V1 §2.4), so an over-limit tenant is a real state an
 * operator has to see.
 */
interface QuotaRatioProps {
  usage: number;
  limit: number;
  unlimitedText: string;
}

const QuotaRatio: React.FC<QuotaRatioProps> = ({ usage, limit, unlimitedText }) => {
  const tone = isUnlimitedQuota(limit)
    ? ''
    : usage > limit
      ? 'tenant-quota-is-over'
      : usage >= limit
        ? 'tenant-quota-is-full'
        : '';

  return (
    <Typography.Text className={tone ? `tenant-quota ${tone}` : 'tenant-quota'}>
      {`${usage} / ${formatQuotaLimit(limit, unlimitedText)}`}
    </Typography.Text>
  );
};

export default QuotaRatio;
