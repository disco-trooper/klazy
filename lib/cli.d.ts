import type { SelectConfig, InputConfig } from './types';
/**
 * Interactive selection from options list
 */
export declare const select: ({ question, options, pointer, autocomplete }: SelectConfig) => Promise<string>;
/**
 * Interactive input with validation
 */
export declare const input: ({ question, invalidWarning, defaultValue, validationCallback }: InputConfig) => Promise<string>;
