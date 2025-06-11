// Date system constants
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';
export const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];
export const WEEKS_PER_SEASON = 12;
export const SEASONS_PER_YEAR = 4;
export const STARTING_WEEK = 1;
export const STARTING_SEASON: Season = 'Spring';
export const STARTING_YEAR = 2024;

// Game Date structure
export interface GameDate {
  week: number;
  season: Season;
  year: number;
}

/**
 * Format a game date as a string
 */
export function formatGameDate(date: GameDate): string {
  return `Week ${date.week}, ${date.season} ${date.year}`;
}

/**
 * Format a number with appropriate thousand separators and decimal places
 */
export function formatNumber(value: number, options?: {
  decimals?: number;
  forceDecimals?: boolean;
  smartDecimals?: boolean;
}): string {
  const { decimals = 2, forceDecimals = false, smartDecimals = false } = options || {};
  
  // For large numbers (>1000), don't show decimals unless forced
  if (Math.abs(value) >= 1000 && !forceDecimals && !smartDecimals) {
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 0
    });
  }
  
  // For small whole numbers, don't show decimals unless forced
  if (Number.isInteger(value) && !forceDecimals && !smartDecimals) {
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 0
    });
  }
  
  // Smart decimals mode: show up to specified decimals but remove trailing zeros
  if (smartDecimals) {
    const maxDecimals = Math.min(decimals, 5); // Cap at 5 decimals for readability
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals
    });
    return formatted;
  }
  
  // For decimals or when forced, show specified decimal places
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format a number as currency (euros)
 */
export function formatCurrency(value: number, decimals = 0): string {
  return `€${formatNumber(value, { decimals, forceDecimals: true })}`;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
} 