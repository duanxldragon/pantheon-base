interface AutomationRuntime {
  dev?: boolean;
  webdriver?: boolean;
}

function isDevRuntime() {
  return Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);
}

function isAutomatedBrowserRuntime() {
  return Boolean(globalThis.navigator?.webdriver);
}

export function isAutomatedDevBrowserRuntime(runtime: AutomationRuntime = {}) {
  const dev = runtime.dev ?? isDevRuntime();
  const webdriver = runtime.webdriver ?? isAutomatedBrowserRuntime();
  return dev && webdriver;
}

export function shouldRunBackgroundNetworkTasks(runtime: AutomationRuntime = {}) {
  return !isAutomatedDevBrowserRuntime(runtime);
}

export function shouldWarmHighFrequencyRouteData(runtime: AutomationRuntime = {}) {
  return shouldRunBackgroundNetworkTasks(runtime);
}

export function shouldFetchRemoteI18nPack(runtime: AutomationRuntime = {}) {
  return shouldRunBackgroundNetworkTasks(runtime);
}

export function shouldPollServerRefreshState(runtime: AutomationRuntime = {}) {
  return shouldRunBackgroundNetworkTasks(runtime);
}

export function shouldReportShellActivity(runtime: AutomationRuntime = {}) {
  return shouldRunBackgroundNetworkTasks(runtime);
}

export function shouldLoadShellNoticeSummary(runtime: AutomationRuntime = {}) {
  return shouldRunBackgroundNetworkTasks(runtime);
}
