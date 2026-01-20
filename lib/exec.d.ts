import type { Pod } from './types';
/**
 * Get all pods, optionally across all namespaces
 */
export declare function getPods(allNamespaces?: boolean): Pod[];
/**
 * Interactive exec into a pod
 */
export declare function execIntoPod(searchTerm?: string, allNamespaces?: boolean): Promise<void>;
