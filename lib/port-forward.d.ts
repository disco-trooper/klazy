import type { Service, ResourceType } from './types';
export declare function getServices(allNamespaces?: boolean): Service[];
export declare function portForward(resourceType: ResourceType, allNamespaces?: boolean): Promise<void>;
