/**
 * Formats a number with commas for readability (e.g. 1000 -> 1,000).
 * Handles numbers, numeric strings, and edge cases gracefully.
 *
 * @param {number|string} val - The number or numeric string to format
 * @returns {string} Number formatted with commas
 */
export const formatNumber = (val) => {
    if (val === null || val === undefined || val === '') return '0';
    const cleanStr = String(val).replace(/,/g, '').trim();
    const num = Number(cleanStr);
    if (isNaN(num)) return String(val);
    return num.toLocaleString('en-US');
};
