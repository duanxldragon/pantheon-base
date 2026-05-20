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
  'business/mdqaorder/MdqaorderList': defineRegistryEntry(() => import('../../modules/business/mdqaorder/MdqaorderList')),
  'business/mdqaorder/MdqaorderDetail': defineRegistryEntry(() => import('../../modules/business/mdqaorder/MdqaorderDetail')),
  'business/mdqaorderitem/MdqaorderitemList': defineRegistryEntry(() => import('../../modules/business/mdqaorderitem/MdqaorderitemList')),
  'business/mdqaorderitem/MdqaorderitemDetail': defineRegistryEntry(() => import('../../modules/business/mdqaorderitem/MdqaorderitemDetail')),
} satisfies Record<string, RegistryEntry>;
