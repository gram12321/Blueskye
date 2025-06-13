// Fleet management service for Blueskye Air Management Game

import { Aircraft, FleetStats } from './aircraftTypes';
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
  const gameState = getGameState();
  const aircraftType = getAircraftType(aircraftTypeId);
  if (!aircraftType) {
    return false;
  }
  if (!gameState.player) {
    return false;
  }
  if (gameState.player.money < aircraftType.cost) {
    return false;
  }
  // Create new aircraft instance
  const newAircraft = {
    id: generateAircraftId(),
    aircraftTypeId: aircraftType.id,
    purchaseDate: new Date(),
    totalFlightHours: 0,
    status: 'available' as const,
    condition: 100,
    maintenanceLastDone: 0,
    maintenancePlan: 4
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

// Get owned aircraft types (unique types from fleet)
export function getOwnedAircraftTypes(): string[] {
  const fleet = getFleet();
  const uniqueTypes = new Set(fleet.map(aircraft => aircraft.aircraftTypeId));
  return Array.from(uniqueTypes);
} 