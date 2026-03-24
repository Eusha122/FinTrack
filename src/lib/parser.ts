import { ParsedInput } from './types';

/**
 * Parse fast-input string into structured data.
 * 
 * Formats supported:
 *   200 food           → expense, 200, category=food
 *   200 food lunch     → expense, 200, category=food, note=lunch
 *   +5000 salary       → income, 5000, category=salary
 *   -300 transport     → expense, 300, category=transport
 *   no sign            → default expense
 *   + prefix           → income
 *   - prefix           → expense
 *   first number       → amount
 *   rest               → category + note
 */
export function parseInput(raw: string, categories: string[]): ParsedInput | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Determine type from sign
  let type: 'income' | 'expense' = 'expense';
  let cleaned = trimmed;

  if (cleaned.startsWith('+')) {
    type = 'income';
    cleaned = cleaned.slice(1).trim();
  } else if (cleaned.startsWith('-')) {
    type = 'expense';
    cleaned = cleaned.slice(1).trim();
  }

  // Extract amount (first number in string)
  const amountMatch = cleaned.match(/^(\d+(?:\.\d+)?)/);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1]);
  if (amount <= 0 || isNaN(amount)) return null;

  // Everything after the amount
  const rest = cleaned.slice(amountMatch[0].length).trim();
  const words = rest.split(/\s+/).filter(Boolean);

  let category = 'Others';
  let note = '';

  if (words.length > 0) {
    // Try to match first word to existing category (case-insensitive)
    const firstWord = words[0];
    const matched = categories.find(
      c => c.toLowerCase() === firstWord.toLowerCase()
    );

    if (matched) {
      category = matched;
      note = words.slice(1).join(' ');
    } else {
      // Fuzzy: check if first word starts with a category name
      const fuzzyMatch = categories.find(
        c => c.toLowerCase().startsWith(firstWord.toLowerCase()) && firstWord.length >= 2
      );
      if (fuzzyMatch) {
        category = fuzzyMatch;
        note = words.slice(1).join(' ');
      } else {
        // Use first word as category (capitalize), rest as note
        category = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
        note = words.slice(1).join(' ');
      }
    }
  }

  return { amount, type, category, note };
}

/**
 * Format currency amount
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format with sign
 */
export function formatMoneyWithSign(amount: number, type: 'income' | 'expense' | 'transfer'): string {
  const formatted = formatMoney(amount);
  if (type === 'income') return `+${formatted}`;
  if (type === 'expense') return `-${formatted}`;
  return formatted;
}
