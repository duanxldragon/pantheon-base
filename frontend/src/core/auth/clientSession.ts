const CLIENT_SESSION_HINT_STORAGE_KEY = 'pantheon_session_hint';

function removeStorage(key: string) {
  if (globalThis.localStorage === undefined) {
    return;
  }
  try {
    globalThis.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures and continue with in-memory app state.
  }
}

let inMemoryCsrfToken = '';
let sessionHintStored = false;

export function markAuthSessionActive() {
  sessionHintStored = true;
}

export function persistCsrfToken(token: string) {
  const normalized = token.trim();
  if (!normalized) {
    return;
  }
  inMemoryCsrfToken = normalized;
  markAuthSessionActive();
}

export function readStoredCsrfToken(): string {
  return inMemoryCsrfToken;
}

export function clearClientAuthSession() {
  inMemoryCsrfToken = '';
  sessionHintStored = false;
  removeStorage(CLIENT_SESSION_HINT_STORAGE_KEY);
}

export function hasAuthSessionHint(): boolean {
  return sessionHintStored || inMemoryCsrfToken !== '';
}
