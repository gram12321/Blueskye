import { getGameState, updateGameState } from './gameState';
import { DAYS_PER_WEEK, WEEKS_PER_MONTH, MONTHS_PER_YEAR } from './utils';
import { generateAllPassengers } from '../geography/passengerDemandService';

// Game time constants
export const HOURS_PER_DAY = 24;

/**
 * Advance the game by one day.
 * Handles day, week, month, year progression.

 */
export function advanceDay(): void {
  const gameState = getGameState();
  let { day, week, month, year } = gameState;

  // Increment day
  let newDay = day + 1;
  let newWeek = week;
  let newMonth = month;
  let newYear = year;

  // Generate new passengers every day (tick)
  generateAllPassengers(newDay);

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

  // TODO: Process new flight system with permanent routes
  // processNewFlightSystem(HOURS_PER_DAY);
}



export const gameTick = {
  advanceDay
  
}; 