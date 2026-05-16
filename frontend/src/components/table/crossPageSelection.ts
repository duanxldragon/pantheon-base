export type CrossPageRowKey = string | number;

function normalizeRowKey(key: CrossPageRowKey) {
  return String(key);
}

export function getVisibleSelectedRowKeys(
  selectedRowKeys: CrossPageRowKey[],
  visibleRowKeys: CrossPageRowKey[],
) {
  const visibleKeySet = new Set(visibleRowKeys.map(normalizeRowKey));
  return selectedRowKeys.filter((key) => visibleKeySet.has(normalizeRowKey(key)));
}

export function mergeCrossPageSelection(
  selectedRowKeys: CrossPageRowKey[],
  nextVisibleSelectedRowKeys: CrossPageRowKey[],
  visibleRowKeys: CrossPageRowKey[],
) {
  const visibleKeySet = new Set(visibleRowKeys.map(normalizeRowKey));
  const hiddenSelectedRowKeys = selectedRowKeys.filter(
    (key) => !visibleKeySet.has(normalizeRowKey(key)),
  );
  const mergedRowKeys = [...hiddenSelectedRowKeys, ...nextVisibleSelectedRowKeys];
  const seen = new Set<string>();

  return mergedRowKeys.filter((key) => {
    const normalizedKey = normalizeRowKey(key);
    if (seen.has(normalizedKey)) {
      return false;
    }
    seen.add(normalizedKey);
    return true;
  });
}
