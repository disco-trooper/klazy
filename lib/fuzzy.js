/**
 * Fuzzy match pattern against text
 * @param {string} pattern - search pattern
 * @param {string} text - text to match against
 * @returns {number} - score (0 = no match, higher = better match)
 */
function fuzzyMatch(pattern, text) {
    if (!pattern) return 1;

    pattern = pattern.toLowerCase();
    text = text.toLowerCase();

    let patternIdx = 0;
    let score = 0;
    let consecutive = 0;

    for (let i = 0; i < text.length && patternIdx < pattern.length; i++) {
        if (text[i] === pattern[patternIdx]) {
            consecutive++;
            // Bonus for word boundaries (start, after - or _)
            const isWordStart = i === 0 || text[i - 1] === '-' || text[i - 1] === '_';
            score += consecutive + (isWordStart ? 5 : 0);
            patternIdx++;
        } else {
            consecutive = 0;
        }
    }

    return patternIdx === pattern.length ? score : 0;
}

/**
 * Filter and sort items by fuzzy match score
 * @param {Array<string>} items - items to filter
 * @param {string} pattern - search pattern
 * @returns {Array<{item: string, originalIndex: number}>} - filtered items with original indices
 */
function fuzzyFilter(items, pattern) {
    if (!pattern) {
        return items.map((item, i) => ({ item, originalIndex: i }));
    }

    return items
        .map((item, i) => ({ item, originalIndex: i, score: fuzzyMatch(pattern, item) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item, originalIndex }) => ({ item, originalIndex }));
}

module.exports = { fuzzyMatch, fuzzyFilter };
