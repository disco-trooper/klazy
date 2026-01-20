import type { Service } from './types';
export declare function getServices(allNamespaces?: boolean): Service[];
export declare function portForward(resourceType: string, allNamespaces?: boolean): Promise<void>;
