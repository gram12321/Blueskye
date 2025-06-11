import { getGameState, updateGameState } from './gameState';

// Constants for seasons and weeks per season
export const SEASONS: Array<'Spring' | 'Summer' | 'Fall' | 'Winter'> = ['Spring', 'Summer', 'Fall', 'Winter'];
export const WEEKS_PER_SEASON = 12;

/**
 * Advance the game by one week.
 * Handles week, season, year progression and increments political power.
 * (Extend this function with more simulation logic as needed)
 */
export function advanceWeek(): void {
  const gameState = getGameState();
  let { week, season, year } = gameState;

  // Increment week
  let newWeek = week + 1;
  let newSeason = season;
  let newYear = year;

  // Check if it's time for a new season
  if (newWeek > WEEKS_PER_SEASON) {
    newWeek = 1;
    const currentSeasonIndex = SEASONS.indexOf(season);
    const newSeasonIndex = (currentSeasonIndex + 1) % SEASONS.length;
    newSeason = SEASONS[newSeasonIndex];
    // Check if it's time for a new year (after Winter)
    if (newSeasonIndex === 0) {
      newYear++;
    }
  }

  // Update game state with new date values and increment political power
  updateGameState({
    week: newWeek,
    season: newSeason,
    year: newYear,
  });

  // Update last played time
  if (gameState.player) {
    gameState.player.lastPlayed = new Date();
    updateGameState({ player: { ...gameState.player } });
  }

}

export const gameTick = {
  advanceWeek
}; 