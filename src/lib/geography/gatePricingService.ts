// Gate pricing service for Blueskye Air Management Game

import { GatePricingParams, GateType, TimeSlot } from './gateTypes';
import { getGameState } from '../gamemechanics/gameState';
import { getGateTypeMultiplier } from './gateData';

// Calculate dynamic price for a gate slot
export function calculateGateSlotPrice(params: GatePricingParams): number {
  let price = params.basePrice;
  
  // Apply gate type multiplier
  price *= getGateTypeMultiplier(params.gateType);
  
  // Apply international flight multiplier
  if (params.isInternational) {
    price *= 1.3; // 30% surcharge for international flights
  }
  
  // Apply time-based modifiers
  price *= getTimeBasedMultiplier(params.slotTime);
  
  // Apply weekend discount
  if (params.isWeekend) {
    price *= 0.9; // 10% weekend discount
  }
  
  // Apply holiday surcharge
  if (params.isHoliday) {
    price *= 1.15; // 15% holiday surcharge
  }
  
  // Apply airport size multiplier based on total gates
  price *= getAirportSizeMultiplier(params.totalGatesAtAirport);
  
  return Math.round(price);
}

// Get time-based pricing multiplier
function getTimeBasedMultiplier(slotTime: TimeSlot): number {
  const hour = slotTime.hour;
  
  // Peak hours (morning and evening rush)
  if ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20)) {
    return 1.25; // 25% peak hour surcharge
  }
  
  // Night hours (less desirable)
  if (hour >= 23 || hour <= 5) {
    return 0.9; // 10% night discount
  }
  
  // Regular hours
  return 1.0;
}

// Get airport size multiplier based on total number of gates
function getAirportSizeMultiplier(totalGates: number): number {
  if (totalGates <= 5) {
    return 0.8; // Small airport - cheaper
  } else if (totalGates > 15) {
    return 1.4; // Very large airport - premium pricing
  } else if (totalGates > 10) {
    return 1.2; // Large airport - higher pricing
  }
  
  return 1.0; // Medium airport - standard pricing
}

// Check if current game time is a weekend
export function isWeekend(): boolean {
  const gameState = getGameState();
  // Simple weekend check - could be enhanced with proper calendar logic
  const dayOfWeek = (gameState.day + gameState.week * 7) % 7;
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
}

// Check if current game time is a holiday
export function isHoliday(): boolean {
  const gameState = getGameState();
  
  // Define some basic holidays (could be expanded)
  const holidays = [
    { month: 1, day: 1 },   // New Year's Day
    { month: 12, day: 25 }, // Christmas
    { month: 12, day: 31 }, // New Year's Eve
  ];
  
  // Simple holiday check based on month and day
  // This is a simplified implementation - real calendar logic would be more complex
  const currentMonth = gameState.month;
  const currentDay = gameState.day;
  
  return holidays.some(holiday => 
    holiday.month === currentMonth && holiday.day === currentDay
  );
}

// Get current game time as TimeSlot
export function getCurrentGameTime(): TimeSlot {
  const gameState = getGameState();
  return {
    hour: gameState.hour,
    minute: 0 // Simplified - assuming we only track hours
  };
}

// Calculate price for multiple slots (with potential bulk discounts)
export function calculateMultiSlotPrice(
  baseParams: GatePricingParams,
  slotCount: number
): number {
  let totalPrice = 0;
  
  for (let i = 0; i < slotCount; i++) {
    totalPrice += calculateGateSlotPrice(baseParams);
  }
  
  // Apply bulk discount for multiple slots
  if (slotCount >= 5) {
    totalPrice *= 0.95; // 5% discount for 5+ slots
  } else if (slotCount >= 10) {
    totalPrice *= 0.9; // 10% discount for 10+ slots
  }
  
  return Math.round(totalPrice);
}

// Get pricing preview for different gate types at an airport
export function getGatePricingPreview(
  airportId: string,
  slotTime: TimeSlot,
  isInternational: boolean = false
): Record<GateType, number> {
  const gameState = getGameState();
  const totalGatesAtAirport = (gameState.airportGateStates[airportId] || []).length;
  
  const baseParams: Omit<GatePricingParams, 'basePrice' | 'gateType'> = {
    isInternational,
    slotTime,
    isHoliday: isHoliday(),
    isWeekend: isWeekend(),
    totalGatesAtAirport
  };
  
  const basePrices = {
    exclusive: 800,
    preferential: 600,
    common: 400
  };
  
  const preview: Record<GateType, number> = {
    exclusive: calculateGateSlotPrice({
      ...baseParams,
      basePrice: basePrices.exclusive,
      gateType: 'exclusive'
    }),
    preferential: calculateGateSlotPrice({
      ...baseParams,
      basePrice: basePrices.preferential,
      gateType: 'preferential'
    }),
    common: calculateGateSlotPrice({
      ...baseParams,
      basePrice: basePrices.common,
      gateType: 'common'
    })
  };
  
  return preview;
} 