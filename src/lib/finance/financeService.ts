// Finance service for Blueskye Air Management Game

import { getGameState } from '../gamemechanics/gameState';

export interface CompanyValue {
  companyValue: number;
  fleetValue: number;
  buildingValue: number;
  cashValue: number;
}

/**
 * Calculate the total value of the current company
 * @returns CompanyValue object with breakdown of different asset types
 */
export function calculateCompanyValue(): CompanyValue {
  const gameState = getGameState();
  
  const cashValue = gameState.player?.money || 0;
  
  // Placeholder values for fleet and buildings
  // These will be implemented when we add fleet management
  const fleetValue = 0; // TODO: Calculate actual fleet value
  const buildingValue = 0; // TODO: Calculate actual building value
  
  const companyValue = cashValue + fleetValue + buildingValue;
  
  return {
    companyValue,
    fleetValue,
    buildingValue,
    cashValue
  };
}

/**
 * Get financial summary for display
 */
export function getFinancialSummary() {
  const gameState = getGameState();
  const companyValue = calculateCompanyValue();
  
  return {
    money: gameState.player?.money || 0,
    ...companyValue
  };
} 