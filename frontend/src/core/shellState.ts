export const OPENED_TABS_STORAGE_KEY = 'pantheon_opened_tabs';
export const SHELL_LAYOUT_MODE_STORAGE_KEY = 'pantheon_shell_layout_mode';

export type ShellLayoutMode = 'vertical' | 'horizontal';

export function readShellLayoutMode(): ShellLayoutMode {
  const rawValue = localStorage.getItem(SHELL_LAYOUT_MODE_STORAGE_KEY);
  return rawValue === 'horizontal' ? 'horizontal' : 'vertical';
}

export function persistShellLayoutMode(mode: ShellLayoutMode) {
  localStorage.setItem(SHELL_LAYOUT_MODE_STORAGE_KEY, mode);
}

export function clearShellSessionState() {
  localStorage.removeItem(OPENED_TABS_STORAGE_KEY);
}
