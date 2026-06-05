import { expect } from '@playwright/test';

const knownThirdPartyRuntimeErrorPatterns = [
  /Accessing element\.ref was removed in React 19/i,
  /^CopyReactDOM\.render is not a function$/,
];

export function expectOnlyAllowedRuntimeErrors(runtimeErrors: string[], allowedPatterns: RegExp[] = []) {
  const allowlist = [...knownThirdPartyRuntimeErrorPatterns, ...allowedPatterns];
  const unexpectedErrors = runtimeErrors.filter(
    (message) => !allowlist.some((pattern) => pattern.test(message)),
  );
  expect(unexpectedErrors).toEqual([]);
}
