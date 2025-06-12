import { getGameState, updateGameState } from './gameState';
import { processFlightRoutes } from '../routes/routeService';
import { DAYS_PER_WEEK, WEEKS_PER_MONTH, MONTHS_PER_YEAR } from './utils';

/**
 * Advance the game by one day.
 * Handles day, week, month, year progression.
 * (Extend this function with more simulation logic as needed)
 */
export function advanceDay(): void {
  const gameState = getGameState();
  let { day, week, month, year } = gameState;

  // Increment day
  let newDay = day + 1;
  let newWeek = week;
  let newMonth = month;
  let newYear = year;

  // Check if it's time for a new week
  if (newDay > DAYS_PER_WEEK) {
    newDay = 1;
    newWeek = week + 1;
    
    // Check if it's time for a new month
    if (newWeek > WEEKS_PER_MONTH) {
      newWeek = 1;
      newMonth = month + 1;
      
      // Check if it's time for a new year
      if (newMonth > MONTHS_PER_YEAR) {
        newMonth = 1;
        newYear = year + 1;
      }
    }
  }

  // Update game state with new date values
  updateGameState({
    day: newDay,
    week: newWeek,
    month: newMonth,
    year: newYear,
  });

  // Update last played time
  if (gameState.player) {
    gameState.player.lastPlayed = new Date();
    updateGameState({ player: { ...gameState.player } });
  }

  // Process flight routes
  processFlightRoutes();
}

/**
 * Legacy function name for compatibility
 * @deprecated Use advanceDay() instead
 */
export function advanceWeek(): void {
  // Advance by 7 days (1 week)
  for (let i = 0; i < DAYS_PER_WEEK; i++) {
    advanceDay();
  }
}

export const gameTick = {
  advanceDay,
  advanceWeek
}; 