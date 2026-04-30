export const TABLE_ACTION_COLUMN_WIDTH = {
  single: 120,
  compact: 180,
  medium: 260,
  wide: 320,
} as const;

export type TableActionColumnWidthPreset = keyof typeof TABLE_ACTION_COLUMN_WIDTH;
