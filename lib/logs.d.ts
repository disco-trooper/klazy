import type { ResourceType } from './types';
export declare function streamLogs(resourceType: ResourceType, searchTerm: string | undefined, allNamespaces?: boolean, follow?: boolean): Promise<void>;
