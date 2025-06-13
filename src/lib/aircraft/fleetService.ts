// Fleet management service for Blueskye Air Management Game

import { Aircraft, FleetStats, AircraftType } from './aircraftTypes';
import { getAircraftType } from './aircraftData';
import { getGameState, updateGameState } from '../gamemechanics/gameState';
import { displayManager } from '../gamemechanics/displayManager';
import { addMoney } from '../finance/financeService';

// Generate unique aircraft ID
function generateAircraftId(): string {
  return 'aircraft-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

// Purchase a new aircraft
export const purchaseAircraft = displayManager.createActionHandler((aircraftTypeId: string): boolean => {
  console.log('[purchaseAircraft] called with', aircraftTypeId);
  const gameState = getGameState();
  const aircraftType = getAircraftType(aircraftTypeId);
  if (!aircraftType) {
    console.log('[purchaseAircraft] FAILED: aircraftType not found');
    return false;
  }
  if (!gameState.player) {
    console.log('[purchaseAircraft] FAILED: no player');
    return false;
  }
  if (gameState.player.money < aircraftType.cost) {
    console.log('[purchaseAircraft] FAILED: insufficient funds', gameState.player.money, '<', aircraftType.cost);
    return false;
  }
  // Create new aircraft instance
  const newAircraft = {
    id: generateAircraftId(),
    aircraftTypeId: aircraftType.id,
    purchaseDate: new Date(),
    totalFlightHours: 0,
    status: 'available' as const,
    condition: 100
  };
  // Add to fleet and record transaction
  const currentFleet = gameState.fleet || [];
  updateGameState({ fleet: [...currentFleet, newAircraft] });
  // Record purchase transaction
  addMoney(
    -aircraftType.cost,
    'Aircraft Purchase',
    `Purchased ${aircraftType.name} (ID: ${newAircraft.id.slice(-8)})`
  );
  console.log('[purchaseAircraft] SUCCESS: aircraft purchased', newAircraft);
  return true;
});

// Sell an aircraft
export const sellAircraft = displayManager.createActionHandler((aircraftId: string): boolean => {
  const gameState = getGameState();
  const currentFleet = gameState.fleet || [];
  
  const aircraftIndex = currentFleet.findIndex(aircraft => aircraft.id === aircraftId);
  if (aircraftIndex === -1) {
    return false;
  }
  
  const aircraft = currentFleet[aircraftIndex];
  const aircraftType = getAircraftType(aircraft.aircraftTypeId);
  
  if (!aircraftType) {
    return false;
  }
  
  // Cannot sell aircraft that are in flight
  if (aircraft.status === 'in-flight') {
    return false;
  }
  
  // Calculate sell value based on condition (50-80% of original value)
  const sellValue = Math.floor(aircraftType.cost * (0.5 + (aircraft.condition / 100) * 0.3));
  
  // Remove from fleet and record transaction
  const newFleet = currentFleet.filter(a => a.id !== aircraftId);
  updateGameState({ fleet: newFleet });
  
  // Record sale transaction
  addMoney(
    sellValue,
    'Aircraft Sale',
    `Sold ${aircraftType.name} (ID: ${aircraft.id.slice(-8)}) - Condition: ${aircraft.condition}%`
  );
  
  return true;
});

// Get player's fleet
export function getFleet(): Aircraft[] {
  const gameState = getGameState();
  return gameState.fleet || [];
}

// Get aircraft by ID
export function getAircraft(aircraftId: string): Aircraft | undefined {
  const fleet = getFleet();
  return fleet.find(aircraft => aircraft.id === aircraftId);
}

// Get available aircraft (not in flight or maintenance)
export function getAvailableAircraft(): Aircraft[] {
  const fleet = getFleet();
  return fleet.filter(aircraft => aircraft.status === 'available');
}

// Update aircraft status
export const updateAircraftStatus = displayManager.createActionHandler((
  aircraftId: string, 
  status: Aircraft['status'],
  routeId?: string
): void => {
  const gameState = getGameState();
  const currentFleet = gameState.fleet || [];
  
  const updatedFleet = currentFleet.map(aircraft => {
    if (aircraft.id === aircraftId) {
      return {
        ...aircraft,
        status,
        currentRoute: status === 'in-flight' ? routeId : undefined
      };
    }
    return aircraft;
  });
  
  updateGameState({ fleet: updatedFleet });
});

// Calculate fleet statistics
export function getFleetStats(): FleetStats {
  const fleet = getFleet();
  
  let totalValue = 0;
  let weeklyMaintenanceCost = 0;
  
  const stats = fleet.reduce((acc, aircraft) => {
    const aircraftType = getAircraftType(aircraft.aircraftTypeId);
    if (aircraftType) {
      totalValue += aircraftType.cost * (aircraft.condition / 100) * 0.7; // Depreciated value
      weeklyMaintenanceCost += aircraftType.maintenanceCost;
    }
    
    switch (aircraft.status) {
      case 'available':
        acc.available++;
        break;
      case 'in-flight':
        acc.inFlight++;
        break;
      case 'maintenance':
        acc.maintenance++;
        break;
    }
    
    return acc;
  }, {
    available: 0,
    inFlight: 0,
    maintenance: 0
  });
  
  return {
    totalAircraft: fleet.length,
    availableAircraft: stats.available,
    inFlightAircraft: stats.inFlight,
    maintenanceAircraft: stats.maintenance,
    totalValue,
    weeklyMaintenanceCost
  };
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

// Calculate maintenance restore rate per hour for an aircraft type
function getMaintenanceRestorePerHour(aircraftType: AircraftType): number {
  // Example: base rate is 200 / tonnage (so 41t = ~4.88, 80t = 2.5)
  return 200 / aircraftType.tonnage;
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

// Get owned aircraft types (unique types from fleet)
export function getOwnedAircraftTypes(): string[] {
  const fleet = getFleet();
  const uniqueTypes = new Set(fleet.map(aircraft => aircraft.aircraftTypeId));
  return Array.from(uniqueTypes);
}

// Deduct weekly maintenance costs for all aircraft
export function processWeeklyMaintenanceCosts(): void {
  const gameState = getGameState();
  if (!gameState.player) return;
  const fleet = getFleet();
  let totalCost = 0;
  fleet.forEach(aircraft => {
    const aircraftType = getAircraftType(aircraft.aircraftTypeId);
    if (aircraftType) {
      totalCost += aircraftType.maintenanceCost;
      addMoney(-aircraftType.maintenanceCost, 'Maintenance', `Weekly maintenance for ${aircraftType.name} (ID: ${aircraft.id.slice(-8)})`);
    }
  });
  // Optionally, could show a summary notification here
}

// Helper to calculate hours since purchase
function getHoursSincePurchase(aircraft: Aircraft, gameState: any): number {
  const purchaseDate = new Date(aircraft.purchaseDate);
  // Calculate total hours in game time
  const gameHours = (((((gameState.year - 2024) * 12 + (gameState.month - 1)) * 4 + (gameState.week - 1)) * 7 + (gameState.day - 1)) * 24 + (gameState.hour || 0));
  // Calculate total hours at purchase
  const purchaseYear = purchaseDate.getFullYear();
  const purchaseMonth = purchaseDate.getMonth() + 1; // JS months are 0-based
  const purchaseDay = purchaseDate.getDate();
  const purchaseHour = purchaseDate.getHours();
  const purchaseWeek = Math.ceil(purchaseDay / 7);
  const purchaseGameHours = (((((purchaseYear - 2024) * 12 + (purchaseMonth - 1)) * 4 + (purchaseWeek - 1)) * 7 + (purchaseDay - 1)) * 24 + purchaseHour);
  return gameHours - purchaseGameHours;
}

// Helper to determine if maintenance is due for an aircraft
function isMaintenanceDue(aircraft: Aircraft, gameState: any): boolean {
  if (aircraft.status === 'maintenance') return false;
  const hoursSincePurchase = getHoursSincePurchase(aircraft, gameState);
  const interval = 168;
  return (hoursSincePurchase - (aircraft.maintenanceLastDone ?? 0)) >= interval;
}

// Update: Staggered maintenance based on purchase date
export function scheduleWeeklyMaintenance(): void {
  const gameState = getGameState();
  const currentFleet = gameState.fleet || [];
  let changed = false;
  const now = gameState;
  const updatedFleet = currentFleet.map(aircraft => {
    if (
      (aircraft.maintenancePlan && aircraft.maintenancePlan > 0 &&
      aircraft.status !== 'maintenance')
    ) {
      if (isMaintenanceDue(aircraft, now)) {
        changed = true;
        return {
          ...aircraft,
          status: 'maintenance' as const,
          maintenanceHoursRemaining: aircraft.maintenancePlan,
          maintenanceLastDone: getHoursSincePurchase(aircraft, now) // Track when maintenance was last started
        };
      }
    }
    return aircraft;
  });
  if (changed) updateGameState({ fleet: updatedFleet });
} 