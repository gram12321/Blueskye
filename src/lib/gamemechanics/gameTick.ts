import { getGameState, updateGameState } from './gameState';
import { DAYS_PER_WEEK, WEEKS_PER_MONTH, MONTHS_PER_YEAR } from './utils';
import { generateAllPassengers } from '../geography/passengerDemandService';
import { getAircraftType } from '../aircraft/aircraftData';
import { Flight } from '../routes/routeTypes';

// Game time constants
export const HOURS_PER_DAY = 24;

function processContinuousFlights() {
  const gameState = getGameState();
  let { routes, activeFlights, fleet } = gameState;
  const updatedFlights: Flight[] = [];

  for (const route of routes) {
    if (!route.isActive) continue;
    for (const schedule of route.aircraftSchedules) {
      const aircraft = fleet.find(a => a.id === schedule.aircraftId);
      const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : undefined;
      if (!aircraftType) continue;
      
      // Find or create a flight for this aircraft/route
      let flight = activeFlights.find(f => f.routeId === route.id && f.aircraftId === schedule.aircraftId);
      const roundTripTime = route.flightTime * 2 + 1; // hours
      
      if (!flight) {
        flight = {
          id: 'flight-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11),
          routeId: route.id,
          aircraftId: schedule.aircraftId,
          status: 'in-progress',
          direction: 'outbound',
          departureTime: new Date(),
          estimatedArrival: new Date(Date.now() + roundTripTime * 60 * 60 * 1000),
          passengers: Math.floor(aircraftType.maxPassengers * 0.7), // 70% load factor for now
          maxPassengers: aircraftType.maxPassengers,
          totalRevenue: 0,
          operationalCosts: 0,
          profit: 0,
          currentProgress: 0,
          remainingTime: roundTripTime,
        };
      } else {
        // Advance progress by 1 hour
        const progressIncrement = 100 / roundTripTime; // Progress per hour
        let newProgress = (flight.currentProgress || 0) + progressIncrement;
        let newRemainingTime = Math.max(0, (flight.remainingTime || roundTripTime) - 1);
        
        if (newProgress >= 100) {
          // Flight completed, start new one immediately
          newProgress = progressIncrement; // Start next flight with 1 hour progress
          newRemainingTime = roundTripTime - 1;
        }
        
        flight = {
          ...flight,
          currentProgress: newProgress,
          remainingTime: newRemainingTime,
        };
      }
      updatedFlights.push(flight);
    }
  }
  updateGameState({ activeFlights: updatedFlights });
}

/**
 * Advance the game by one hour.
 * Handles hour, day, week, month, year progression.
 */
export function advanceHour(): void {
  const gameState = getGameState();
  let { hour, day, week, month, year } = gameState;

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