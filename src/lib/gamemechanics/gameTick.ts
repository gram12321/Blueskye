import { getGameState, updateGameState } from './gameState';
import { DAYS_PER_WEEK, WEEKS_PER_MONTH, MONTHS_PER_YEAR } from './utils';
import { generateAllPassengers } from '../geography/passengerDemandService';
import { processContinuousFlights } from '../routes/routeService';
import { processWeeklyMaintenanceCosts, processMaintenanceHour, checkAndTriggerMaintenance } from '../aircraft/fleetMaintenance';

// Game time constants
export const HOURS_PER_DAY = 24;

/**
 * Advance the game by one hour.
 * Handles hour, day, week, month, year progression.
 */
export function advanceHour(): void {
  const gameState = getGameState();
  const { hour, day, week, month, year } = gameState;

  // Increment hour
  let newHour = (hour || 0) + 1;
  let newDay = day;
  let newWeek = week;
  let newMonth = month;
  let newYear = year;

  // Check if it's time for a new day
  if (newHour >= HOURS_PER_DAY) {
    newHour = 0;
    newDay = day + 1;
    
    // Generate new passengers every day
    generateAllPassengers(newDay);
    
    // Check if it's time for a new week
    if (newDay > DAYS_PER_WEEK) {
      newDay = 1;
      newWeek = week + 1;
      processWeeklyMaintenanceCosts();
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
  }

  // Update game state with new date values
  updateGameState({
    hour: newHour,
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

  // Process continuous flights every hour
  processContinuousFlights();
  // Process maintenance for all aircraft every hour
  processMaintenanceHour();
  // Check and trigger maintenance based on flight hours every hour
  checkAndTriggerMaintenance();
}

// Keep the old function for backward compatibility, but make it advance 24 hours
export function advanceDay(): void {
  for (let i = 0; i < HOURS_PER_DAY; i++) {
    advanceHour();
  }
}

export const gameTick = {
  advanceHour,
  advanceDay
}; 