// Simplified gate data helpers for Blueskye Air Management Game

import { Gate, GateType } from './gateTypes';
import { getGameState } from '../gamemechanics/gameState';

// Helper functions for gate data management
export function getAirportGates(airportId: string): Gate[] {
  const gameState = getGameState();
  const airportGates = gameState.airportGateStates[airportId] || [];
  return airportGates.filter(gate => gate.isActive);
}

export function getGateById(gateId: string): Gate | undefined {
  const gameState = getGameState();
  for (const airportGates of Object.values(gameState.airportGateStates)) {
    const gate = airportGates.find(g => g.id === gateId);
    if (gate) return gate;
  }
  return undefined;
}

export function getGatesByType(airportId: string, gateType: GateType): Gate[] {
  const airportGates = getAirportGates(airportId);
  return airportGates.filter(gate => gate.gateType === gateType);
}

// Aircraft size compatibility mapping
export function getAircraftSizeCategory(tonnage: number): 'small' | 'medium' | 'large' {
  if (tonnage <= 35) return 'small';
  if (tonnage <= 45) return 'medium';
  return 'large';
}

export function isAircraftCompatibleWithGate(aircraftTonnage: number, gate: Gate): boolean {
  const aircraftSize = getAircraftSizeCategory(aircraftTonnage);
  
  // Size compatibility matrix
  const compatibility = {
    'small': ['small', 'medium', 'large'],
    'medium': ['medium', 'large'],
    'large': ['large']
  };
  
  return compatibility[aircraftSize].includes(gate.maxAircraftSize);
}

// Gate pricing modifiers based on airport size and other factors
export function getGateTypeMultiplier(gateType: GateType): number {
  const multipliers = {
    exclusive: 1.5,
    preferential: 1.2,
    common: 1.0
  };
  return multipliers[gateType];
}

// Base gate costs for purchasing/building gates
export function getGatePurchaseCost(gateType: GateType, totalGatesAtAirport: number): number {
  const baseCosts = {
    exclusive: 5000000, // 5 million euros
    preferential: 3000000, // 3 million euros
    common: 1500000 // 1.5 million euros
  };
  
  // Adjust multiplier based on total number of gates at the airport
  let sizeMultiplier = 1.0;
  if (totalGatesAtAirport <= 5) {
    sizeMultiplier = 0.8; // Smaller airport, cheaper gates
  } else if (totalGatesAtAirport > 10) {
    sizeMultiplier = 1.3; // Larger airport, more expensive gates
  }
  
  return Math.round(baseCosts[gateType] * sizeMultiplier);
} 