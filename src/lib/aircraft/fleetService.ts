// Fleet management service for Blueskye Air Management Game

import { Aircraft, FleetStats } from './aircraftTypes';
import { getAircraftType } from './aircraftData';
import { getGameState, updateGameState, updatePlayerMoney } from '../gamemechanics/gameState';
import { displayManager } from '../gamemechanics/displayManager';

// Generate unique aircraft ID
function generateAircraftId(): string {
  return 'aircraft-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

// Purchase a new aircraft
export const purchaseAircraft = displayManager.createActionHandler((aircraftTypeId: string): boolean => {
  const gameState = getGameState();
  const aircraftType = getAircraftType(aircraftTypeId);
  
  if (!aircraftType || !gameState.player) {
    return false;
  }
  
  // Check if player has enough money
  if (gameState.player.money < aircraftType.cost) {
    return false;
  }
  
  // Create new aircraft instance
  const newAircraft: Aircraft = {
    id: generateAircraftId(),
    aircraftTypeId: aircraftType.id,
    purchaseDate: new Date(),
    totalFlightHours: 0,
    status: 'available',
    condition: 100
  };
  
  // Add to fleet and deduct money
  const currentFleet = gameState.fleet || [];
  updateGameState({ fleet: [...currentFleet, newAircraft] });
  updatePlayerMoney(-aircraftType.cost);
  
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
  
  // Remove from fleet and add money
  const newFleet = currentFleet.filter(a => a.id !== aircraftId);
  updateGameState({ fleet: newFleet });
  updatePlayerMoney(sellValue);
  
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

// Add flight hours and update condition
export const addFlightHours = displayManager.createActionHandler((aircraftId: string, hours: number): void => {
  const gameState = getGameState();
  const currentFleet = gameState.fleet || [];
  
  const updatedFleet = currentFleet.map(aircraft => {
    if (aircraft.id === aircraftId) {
      const newFlightHours = aircraft.totalFlightHours + hours;
      // Condition decreases over time (roughly 1% per 1000 hours)
      const conditionLoss = Math.min(1, hours / 1000);
      const newCondition = Math.max(0, aircraft.condition - conditionLoss);
      
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

// Perform maintenance on aircraft
export const performMaintenance = displayManager.createActionHandler((aircraftId: string): boolean => {
  const gameState = getGameState();
  const aircraft = getAircraft(aircraftId);
  const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : null;
  
  if (!aircraft || !aircraftType || !gameState.player) {
    return false;
  }
  
  // Cannot maintain aircraft in flight
  if (aircraft.status === 'in-flight') {
    return false;
  }
  
  // Calculate maintenance cost based on condition
  const maintenanceCost = aircraftType.maintenanceCost * (1 + (100 - aircraft.condition) / 100);
  
  if (gameState.player.money < maintenanceCost) {
    return false;
  }
  
  // Restore condition and deduct money
  const currentFleet = gameState.fleet || [];
  const updatedFleet = currentFleet.map(a => {
    if (a.id === aircraftId) {
      return {
        ...a,
        condition: Math.min(100, a.condition + 20), // Restore up to 20 condition points
        status: 'available' as const
      };
    }
    return a;
  });
  
  updateGameState({ fleet: updatedFleet });
  updatePlayerMoney(-maintenanceCost);
  
  return true;
}); 