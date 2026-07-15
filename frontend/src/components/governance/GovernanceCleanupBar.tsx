import dayjs from 'dayjs';
import React from 'react';
import {
  Button,
  DatePicker,
  Popconfirm,
  Select,
  TimePicker,
  Typography,
} from '@arco-design/web-react';
import { IconDelete } from '@arco-design/web-react/icon';

const CLEANUP_DATE_FORMAT = 'YYYY-MM-DD';
const CLEANUP_TIME_FORMAT = 'HH:mm';

export type GovernanceCleanupMode = 'retention' | 'range';

interface GovernanceCleanupBarProps {
  showCleanup?: boolean;
  retentionDays: number;
  retentionOptions: number[];
  onRetentionChange: (value: number) => void;
  retentionLabel: (value: number) => string;
  confirmTitle: string;
  actionLabel: string;
  onConfirm: () => void;
  cleanupMode?: GovernanceCleanupMode;
  onCleanupModeChange?: (value: GovernanceCleanupMode) => void;
  cleanupModeLabel?: string;
  cleanupModeOptions?: Array<{ label: string; value: GovernanceCleanupMode }>;
  rangeStartDate?: string;
  rangeStartTime?: string;
  rangeEndDate?: string;
  rangeEndTime?: string;
  onRangeStartDateChange?: (value: string) => void;
  onRangeStartTimeChange?: (value: string) => void;
  onRangeEndDateChange?: (value: string) => void;
  onRangeEndTimeChange?: (value: string) => void;
  rangeStartDateLabel?: string;
  rangeStartTimeLabel?: string;
  rangeEndDateLabel?: string;
  rangeEndTimeLabel?: string;
  hint?: string;
  extraActions?: React.ReactNode;
  trailing?: React.ReactNode;
}

function toDateValue(value?: string) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (match) {
    const [, year, month, day] = match;
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    if (!Number.isNaN(localDate.getTime())) {
      return dayjs(localDate);
    }
  }
  const parsed = dayjs(trimmed);
  return parsed.isValid() ? parsed : null;
}

function toTimeValue(value?: string) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return null;
  }
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (match) {
    const [, hour, minute, second = '00'] = match;
    const localTime = new Date(1970, 0, 1, Number(hour), Number(minute), Number(second));
    if (!Number.isNaN(localTime.getTime())) {
      return dayjs(localTime);
    }
  }
  const parsed = dayjs(`1970-01-01T${trimmed.length === 5 ? `${trimmed}:00` : trimmed}`);
  return parsed.isValid() ? parsed : null;
}

const GovernanceCleanupBar: React.FC<GovernanceCleanupBarProps> = ({
  retentionDays,
  retentionOptions,
  onRetentionChange,
  retentionLabel,
  confirmTitle,
  actionLabel,
  onConfirm,
  cleanupMode = 'retention',
  onCleanupModeChange,
  cleanupModeLabel,
  cleanupModeOptions,
  rangeStartDate,
  rangeStartTime,
  rangeEndDate,
  rangeEndTime,
  onRangeStartDateChange,
  onRangeStartTimeChange,
  onRangeEndDateChange,
  onRangeEndTimeChange,
  rangeStartDateLabel,
  rangeStartTimeLabel,
  rangeEndDateLabel,
  rangeEndTimeLabel,
  hint,
  extraActions,
  trailing,
  showCleanup = true,
}) => {
  const cleanupAction = (
    <Popconfirm title={confirmTitle} onOk={onConfirm}>
      <Button type="primary" status="danger" icon={<IconDelete />}>
        {actionLabel}
      </Button>
    </Popconfirm>
  );

  const rangeValueStartDate = toDateValue(rangeStartDate);
  const rangeValueStartTime = toTimeValue(rangeStartTime);
  const rangeValueEndDate = toDateValue(rangeEndDate);
  const rangeValueEndTime = toTimeValue(rangeEndTime);

  return (
    <div className="table-batch-action-bar table-batch-action-bar--governance">
      <div className="table-batch-action-bar__main">
        {showCleanup ? (
          <div className="table-batch-action-bar__meta">
            {cleanupModeOptions && onCleanupModeChange ? (
              <Select
                className="table-batch-action-bar__select"
                value={cleanupMode}
                placeholder={cleanupModeLabel}
                onChange={(value) => onCleanupModeChange(value as GovernanceCleanupMode)}
                options={cleanupModeOptions}
              />
            ) : null}
            {cleanupMode === 'range' ? (
              <div className="table-batch-action-bar__range-controls">
                <div className="table-batch-action-bar__cleanup-range-fields">
                  <label className="table-batch-action-bar__cleanup-field">
                    <Typography.Text className="table-batch-action-bar__cleanup-field-label">
                      {rangeStartDateLabel}
                    </Typography.Text>
                    <DatePicker
                      className="table-batch-action-bar__cleanup-picker table-batch-action-bar__cleanup-date-picker"
                      allowClear
                      editable={false}
                      dayStartOfWeek={1}
                      format={CLEANUP_DATE_FORMAT}
                      value={rangeValueStartDate || undefined}
                      placeholder={rangeStartDateLabel}
                      position="br"
                      triggerProps={{
                        className: 'table-batch-action-bar__cleanup-date-popup',
                        autoAlignPopupWidth: false,
                        popupStyle: { maxHeight: 480 },
                        popupAlign: { bottom: 6 },
                      }}
                      onChange={(valueString) => {
                        onRangeStartDateChange?.(valueString || '');
                      }}
                    />
                  </label>
                  <label className="table-batch-action-bar__cleanup-field">
                    <Typography.Text className="table-batch-action-bar__cleanup-field-label">
                      {rangeStartTimeLabel}
                    </Typography.Text>
                    <TimePicker
                      className="table-batch-action-bar__cleanup-picker table-batch-action-bar__cleanup-time-picker"
                      allowClear
                      editable={false}
                      format={CLEANUP_TIME_FORMAT}
                      value={rangeValueStartTime || undefined}
                      placeholder={rangeStartTimeLabel}
                      position="br"
                      triggerProps={{
                        className: 'table-batch-action-bar__cleanup-time-popup',
                        autoAlignPopupWidth: false,
                        popupStyle: { maxHeight: 360 },
                        popupAlign: { bottom: 6 },
                      }}
                      onChange={(valueString) => {
                        onRangeStartTimeChange?.(valueString || '');
                      }}
                    />
                  </label>
                  <label className="table-batch-action-bar__cleanup-field">
                    <Typography.Text className="table-batch-action-bar__cleanup-field-label">
                      {rangeEndDateLabel}
                    </Typography.Text>
                    <DatePicker
                      className="table-batch-action-bar__cleanup-picker table-batch-action-bar__cleanup-date-picker"
                      allowClear
                      editable={false}
                      dayStartOfWeek={1}
                      format={CLEANUP_DATE_FORMAT}
                      value={rangeValueEndDate || undefined}
                      placeholder={rangeEndDateLabel}
                      position="br"
                      triggerProps={{
                        className: 'table-batch-action-bar__cleanup-date-popup',
                        autoAlignPopupWidth: false,
                        popupStyle: { maxHeight: 480 },
                        popupAlign: { bottom: 6 },
                      }}
                      onChange={(valueString) => {
                        onRangeEndDateChange?.(valueString || '');
                      }}
                    />
                  </label>
                  <label className="table-batch-action-bar__cleanup-field">
                    <Typography.Text className="table-batch-action-bar__cleanup-field-label">
                      {rangeEndTimeLabel}
                    </Typography.Text>
                    <TimePicker
                      className="table-batch-action-bar__cleanup-picker table-batch-action-bar__cleanup-time-picker"
                      allowClear
                      editable={false}
                      format={CLEANUP_TIME_FORMAT}
                      value={rangeValueEndTime || undefined}
                      placeholder={rangeEndTimeLabel}
                      position="br"
                      triggerProps={{
                        className: 'table-batch-action-bar__cleanup-time-popup',
                        autoAlignPopupWidth: false,
                        popupStyle: { maxHeight: 360 },
                        popupAlign: { bottom: 6 },
                      }}
                      onChange={(valueString) => {
                        onRangeEndTimeChange?.(valueString || '');
                      }}
                    />
                  </label>
                </div>
                {cleanupAction}
              </div>
            ) : (
              <>
                <Select
                  className="table-batch-action-bar__select"
                  value={retentionDays}
                  onChange={(value) => onRetentionChange(Number(value))}
                  options={retentionOptions.map((option) => ({
                    label: retentionLabel(option),
                    value: option,
                  }))}
                />
                {cleanupAction}
              </>
            )}
            {trailing}
          </div>
        ) : (
          trailing
        )}
        {extraActions ? (
          <div className="table-batch-action-bar__actions">{extraActions}</div>
        ) : null}
      </div>
      {hint ? (
        <Typography.Text type="secondary" className="table-batch-action-bar__hint">
          {hint}
        </Typography.Text>
      ) : null}
    </div>
  );
};

export default GovernanceCleanupBar;
