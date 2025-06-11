// Finance service for Blueskye Air Management Game

import { getGameState } from '../gamemechanics/gameState';

export interface CompanyValue {
  companyValue: number;
  fleetValue: number; // Changed from inventoryValue to fleetValue
  buildingValue: number;
  cashValue: number;
}

export function calculateCompanyValue(): CompanyValue {
  const gameState = getGameState();
  const fleetValue = 0; // Placeholder - will be expanded later with fleet system
  const buildingValue = 0; // Placeholder - will be expanded later
  const cashValue = gameState.player?.money || 0;
  
  const companyValue = fleetValue + buildingValue + cashValue;
  
  return {
    companyValue,
    fleetValue,
    buildingValue,
    cashValue
  };
} 