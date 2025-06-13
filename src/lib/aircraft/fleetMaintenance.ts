// Fleet maintenance service for Blueskye Air Management Game

import { Aircraft, AircraftType } from './aircraftTypes';
import { getAircraftType } from './aircraftData';
import { getGameState, updateGameState } from '../gamemechanics/gameState';
import { displayManager } from '../gamemechanics/displayManager';
import { notificationService } from '../notifications/notificationService';

// Calculate maintenance restore rate per hour for an aircraft type
function getMaintenanceRestorePerHour(aircraftType: AircraftType): number {
  // Example: base rate is 100 / tonnage (so 41t = ~2.44, 80t = 1.25)
  return 100 / aircraftType.tonnage;
}

// Start maintenance: set status, set hours remaining
export const performMaintenance = displayManager.createActionHandler((aircraftId: string, planHours?: number): boolean => {
  const gameState = getGameState();
  const currentFleet = gameState.fleet || [];
  let found = false;
  const updatedFleet = currentFleet.map(aircraft => {
    if (aircraft.id === aircraftId && aircraft.status !== 'in-flight') {
      found = true;
      return {
        ...aircraft,
        status: 'maintenance' as const,
        maintenancePlan: planHours ?? aircraft.maintenancePlan ?? 4, // default 4h/week
        maintenanceHoursRemaining: planHours ?? aircraft.maintenancePlan ?? 4
      };
    }
    return aircraft;
  });
  if (!found) return false;
  updateGameState({ fleet: updatedFleet });
  return true;
});

// Process maintenance for all aircraft each hour
export function processMaintenanceHour(): void {
  const gameState = getGameState();
  const currentFleet = gameState.fleet || [];
  let changed = false;
  const updatedFleet = currentFleet.map(aircraft => {
    if (aircraft.status === 'maintenance' && aircraft.maintenanceHoursRemaining && aircraft.maintenanceHoursRemaining > 0) {
      const newHours = aircraft.maintenanceHoursRemaining - 1;
      const aircraftType = getAircraftType(aircraft.aircraftTypeId);
      const restorePerHour = aircraftType ? getMaintenanceRestorePerHour(aircraftType) : 5;
      // Linear restore: add condition per hour, modified by tonnage
      const newCondition = Math.min(100, (aircraft.condition ?? 0) + restorePerHour);
      if (newHours <= 0) {
        // Maintenance complete
        changed = true;
        return {
          ...aircraft,
          status: 'available' as const,
          maintenanceHoursRemaining: 0,
          condition: newCondition
        };
      } else {
        changed = true;
        return {
          ...aircraft,
          maintenanceHoursRemaining: newHours,
          condition: newCondition
        };
      }
    }
    return aircraft;
  });
  if (changed) updateGameState({ fleet: updatedFleet });
}

// Helper to determine if maintenance is due for an aircraft (now based on flight hours)
function isMaintenanceDue(aircraft: Aircraft): boolean {
  if (aircraft.status === 'maintenance') return false;
  const lastDone = aircraft.maintenanceLastDone ?? 0;
  return (aircraft.totalFlightHours - lastDone) >= 168;
}

// Check and trigger maintenance immediately when aircraft reach 168 flight hours
export function checkAndTriggerMaintenance(): void {
  const gameState = getGameState();
  const currentFleet = gameState.fleet || [];
  let changed = false;
  let sentToMaintenance = 0;
  
  const updatedFleet = currentFleet.map(aircraft => {
    // Only check aircraft that are available and have a maintenance plan
    if (aircraft.status === 'available' && aircraft.maintenancePlan && aircraft.maintenancePlan > 0) {
      const lastDone = aircraft.maintenanceLastDone ?? 0;
      const hoursSinceLastMaintenance = aircraft.totalFlightHours - lastDone;
      
      if (isMaintenanceDue(aircraft)) {
        sentToMaintenance++;
        changed = true;
        return {
          ...aircraft,
          status: 'maintenance' as const,
          maintenanceHoursRemaining: aircraft.maintenancePlan,
          maintenanceLastDone: aircraft.totalFlightHours
        };
      }
    } else if (aircraft.status === 'maintenance') {
      // No action needed for maintenance aircraft
    } else if (!aircraft.maintenancePlan) {
      // No action needed for aircraft without a maintenance plan
    }
    return aircraft;
  });
  
  if (changed) {
    updateGameState({ fleet: updatedFleet });
  }
}

// Keep the old function for now but make it simpler (just for weekly costs)
export function scheduleWeeklyMaintenance(): void {
  console.log('[maintenance] Weekly maintenance cost processing - no longer triggers maintenance');
  // This function now only handles weekly costs, not triggering maintenance
}

// Non-linear condition decay function
function calculateConditionDecay(currentCondition: number, reliability: number, hours: number): number {
  // Decay is faster at high condition, slower at low, and reduced by reliability
  // Example: baseDecay = 0.05 per hour
  const baseDecay = 0.05;
  // Decay curve: (condition/100)^2, so 100% decays 1x, 50% decays 0.25x
  const decay = baseDecay * (1 + Math.pow(currentCondition / 100, 2)) * hours / reliability;
  return decay;
}

// Add flight hours and apply non-linear condition decay
export const addFlightHours = displayManager.createActionHandler((aircraftId: string, hours: number): void => {
  const gameState = getGameState();
  const currentFleet = gameState.fleet || [];
  const updatedFleet = currentFleet.map(aircraft => {
    if (aircraft.id === aircraftId) {
      const aircraftType = getAircraftType(aircraft.aircraftTypeId);
      if (!aircraftType) return aircraft;
      const newFlightHours = aircraft.totalFlightHours + hours;
      // Non-linear condition decay
      const decay = calculateConditionDecay(aircraft.condition, aircraftType.reliability, hours);
      const newCondition = Math.max(0, aircraft.condition - decay);
      return {
        ...aircraft,
        totalFlightHours: newFlightHours,
        condition: newCondition
      };
    }
    return aircraft;
  });
  updateGameState({ fleet: updatedFleet });
});

// Deduct weekly maintenance costs for all aircraft
export function processWeeklyMaintenanceCosts(): void {
  const gameState = getGameState();
  if (!gameState.player) return;
  const fleet = gameState.fleet || [];
  let totalCost = 0;
  fleet.forEach(aircraft => {
    const aircraftType = getAircraftType(aircraft.aircraftTypeId);
    if (aircraftType) {
      totalCost += aircraftType.maintenanceCost;
      // Optionally, could show a summary notification here
    }
  });
  // Optionally, could show a summary notification here
} 