import { useSyncExternalStore } from 'react';
import { getPublicSettingList } from '../../modules/system/setting/api';

export interface PublicSettingsState {
  siteName: string;
  siteLogo: string;
  defaultLanguage: string;
  defaultTheme: string;
  enableTabBar: boolean;
}

const PUBLIC_SETTINGS_STORAGE_KEY = 'pantheon_public_settings';
const PUBLIC_SETTINGS_FALLBACK_SITE_NAME = 'Pantheon Base';
export const LANGUAGE_STORAGE_KEY = 'pantheon_lang';
export const LANGUAGE_EXPLICIT_STORAGE_KEY = 'pantheon_lang_explicit';

let publicSettingsState: PublicSettingsState = readStoredPublicSettings();
const listeners = new Set<() => void>();

function readStoredPublicSettings(): PublicSettingsState {
  if (typeof window === 'undefined') {
    return buildPublicSettingsState({});
  }
  try {
    const rawValue = window.localStorage.getItem(PUBLIC_SETTINGS_STORAGE_KEY);
    if (!rawValue) {
      return buildPublicSettingsState({});
    }
    const parsed = JSON.parse(rawValue) as Record<string, string>;
    return buildPublicSettingsState(parsed);
  } catch {
    return buildPublicSettingsState({});
  }
}

function buildPublicSettingsState(settings: Record<string, string>): PublicSettingsState {
  return {
    siteName: settings['site.name']?.trim() || PUBLIC_SETTINGS_FALLBACK_SITE_NAME,
    siteLogo: settings['site.logo']?.trim() || '',
    defaultLanguage: settings['i18n.default_language']?.trim() || 'zh-CN',
    defaultTheme: settings['ui.default_theme']?.trim() || 'indigo',
    enableTabBar: settings['ui.enable_tab_bar']?.trim() !== 'false',
  };
}

function persistPublicSettings(settings: Record<string, string>) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(PUBLIC_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function notifyPublicSettingsChanged() {
  syncDefaultLanguagePreference();
  if (typeof document !== 'undefined') {
    document.title = publicSettingsState.siteName;
  }
  listeners.forEach((listener) => listener());
}

function syncDefaultLanguagePreference() {
  if (typeof window === 'undefined') {
    return;
  }
  if (!hasExplicitLanguagePreference()) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, publicSettingsState.defaultLanguage);
  }
}

export function getPublicSettingsSnapshot() {
  return publicSettingsState;
}

export function applyPublicSettings(settings: Record<string, string>) {
  publicSettingsState = buildPublicSettingsState(settings);
  persistPublicSettings(settings);
  notifyPublicSettingsChanged();
}

export async function refreshPublicSettings() {
  const response = await getPublicSettingList();
  applyPublicSettings(response.settings);
  return publicSettingsState;
}

export async function initializePublicSettings() {
  notifyPublicSettingsChanged();
  try {
    return await refreshPublicSettings();
  } catch {
    return publicSettingsState;
  }
}

export function usePublicSettings() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getPublicSettingsSnapshot,
    getPublicSettingsSnapshot,
  );
}

export function getBrandInitial(siteName: string) {
  return siteName.trim().charAt(0).toUpperCase() || 'P';
}

export function hasExplicitLanguagePreference() {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(LANGUAGE_EXPLICIT_STORAGE_KEY) === '1';
}

export function setExplicitLanguagePreference(language: string) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  window.localStorage.setItem(LANGUAGE_EXPLICIT_STORAGE_KEY, '1');
}

export function clearExplicitLanguagePreference() {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(LANGUAGE_EXPLICIT_STORAGE_KEY);
  syncDefaultLanguagePreference();
}
