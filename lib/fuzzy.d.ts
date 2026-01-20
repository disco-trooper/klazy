import type { FuzzyResult } from './types';
/**
 * Fuzzy match pattern against text
 * @param pattern - search pattern
 * @param text - text to match against
 * @returns score (0 = no match, higher = better match)
 */
export declare function fuzzyMatch(pattern: string, text: string): number;
/**
 * Filter and sort items by fuzzy match score
 * @param items - items to filter
 * @param pattern - search pattern
 * @returns filtered items with original indices
 */
export declare function fuzzyFilter(items: string[], pattern: string): FuzzyResult[];
