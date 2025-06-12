// Date system constants
export const DAYS_PER_WEEK = 7;
export const WEEKS_PER_MONTH = 4;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_MONTH = DAYS_PER_WEEK * WEEKS_PER_MONTH; // 28 days
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR; // 336 days

export const STARTING_DAY = 1;
export const STARTING_WEEK = 1;
export const STARTING_MONTH = 1;
export const STARTING_YEAR = 2024;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Game Date structure
export interface GameDate {
  day: number;
  week: number;
  month: number;
  year: number;
}

/**
 * Format a game date as a string
 */
export function formatGameDate(date: GameDate): string {
  const monthName = MONTH_NAMES[date.month - 1] || 'Unknown';
  return `Day ${date.day}, Week ${date.week}, ${monthName} ${date.year}`;
}

/**
 * Format a game date as a short string
 */
export function formatGameDateShort(date: GameDate): string {
  const monthName = MONTH_NAMES[date.month - 1] || 'Unknown';
  return `${monthName} ${date.year}`;
}

/**
 * Format a number with appropriate thousand separators and decimal places
 * Includes compact notation for very large numbers
 */
export function formatNumber(value: number, options?: {
  decimals?: number;
  forceDecimals?: boolean;
  smartDecimals?: boolean;
  compact?: boolean;
}): string {
  const { decimals = 2, forceDecimals = false, smartDecimals = false, compact = false } = options || {};
  
  // Compact notation for very large numbers
  if (compact || Math.abs(value) >= 1000000) {
    if (Math.abs(value) >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    } else if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
  }
  
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

/**
 * Calculate the absolute day number since the start of the game
 * This is useful for comparing dates and calculating age in days
 */
export function calculateAbsoluteDays(year: number, month: number, week: number, day: number): number {
  if (typeof year !== 'number' || typeof month !== 'number' || typeof week !== 'number' || typeof day !== 'number') {
    return 0;
  }
  
  // Calculate how many complete years have passed
  const yearsSinceStart = year - STARTING_YEAR;
  
  // Calculate total days
  let totalDays = 0;
  
  // Add days for complete years
  totalDays += yearsSinceStart * DAYS_PER_YEAR;
  
  // Add days for complete months in current year
  totalDays += (month - STARTING_MONTH) * DAYS_PER_MONTH;
  
  // Add days for complete weeks in current month
  totalDays += (week - STARTING_WEEK) * DAYS_PER_WEEK;
  
  // Add days in current week
  totalDays += (day - STARTING_DAY);
  
  return Math.max(0, totalDays);
}

/**
 * Calculate the absolute week number since the start of the game
 * This is useful for comparing dates and calculating age in weeks
 */
export function calculateAbsoluteWeeks(year: number, month: number, week: number): number {
  if (typeof year !== 'number' || typeof month !== 'number' || typeof week !== 'number') {
    return 0;
  }
  
  // Calculate how many complete years have passed
  const yearsSinceStart = year - STARTING_YEAR;
  
  // Calculate total weeks
  let totalWeeks = 0;
  
  // Add weeks for complete years
  totalWeeks += yearsSinceStart * MONTHS_PER_YEAR * WEEKS_PER_MONTH;
  
  // Add weeks for complete months in current year
  totalWeeks += (month - STARTING_MONTH) * WEEKS_PER_MONTH;
  
  // Add weeks in current month
  totalWeeks += (week - STARTING_WEEK);
  
  return Math.max(0, totalWeeks);
} 