// Pantheon Base UI - 入口文件
// 导出所有公共模块和组件

// === Core Router ===
export * from './core/router/types';
export * from './core/router/modules';
export * from './core/router/componentRegistry';
export * from './core/router/RoutePermissionGuard';

// === Store ===
export * from './store/useAuthStore';
export * from './store/useMenuStore';
export * from './store/authTypes';

// === Modules - Auth ===
export * from './modules/auth';

// === Modules - Platform ===
export * from './modules/platform';

// === Components ===
// 根据实际存在的组件导出
// export * from './components/index';

// === Hooks ===
// export * from './hooks/index';
