import { lazy, type LazyExoticComponent, type ComponentType } from 'react';

type ComponentLoader = () => Promise<{ default: ComponentType }>;

interface RegistryEntry {
	component: LazyExoticComponent<ComponentType>;
	preload: ComponentLoader;
}

function defineRegistryEntry(loader: ComponentLoader): RegistryEntry {
	return {
		component: lazy(loader),
		preload: loader,
	};
}

export const generatedComponentRegistry = {
  'business/cmdb/host/CmdbHostList': defineRegistryEntry(() => import('../../modules/business/cmdb/host/CmdbHostList')),
  'business/cmdb/vendor/CmdbVendorList': defineRegistryEntry(() => import('../../modules/business/cmdb/vendor/CmdbVendorList')),
} satisfies Record<string, RegistryEntry>;
