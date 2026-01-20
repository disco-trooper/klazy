import type { Context } from './types';
/**
 * Get all kubectl contexts
 */
export declare function getContexts(): Context[];
/**
 * Interactive context selection
 */
export declare function selectContext(): Promise<string>;
/**
 * Interactive namespace selection for a given context
 */
export declare function selectNamespace(context: string): Promise<string>;
/**
 * Interactive resource selection
 */
export declare function selectResource(resource: string, context: string, namespace: string): Promise<string>;
/**
 * Validate port number
 */
export declare function validatePort(value: string): boolean;
/**
 * Interactive port selection with validation
 */
export declare function selectPort(question: string): Promise<string>;
