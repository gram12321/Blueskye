// Main gate management service for Blueskye Air Management Game

import { 
  Gate, 
  GateType, 
  SlotPolicyType, 
  GateSlot, 
  GateBooking, 
  GateBookingRequest, 
  GateBookingResponse,
  GateAvailability,
  GateStats,
  TimeSlot,
  GateConflict
} from './gateTypes';
import { getGameState, updateGameState } from '../gamemechanics/gameState';
import { displayManager } from '../gamemechanics/displayManager';
import { getAirport } from './airportData';
import { getAircraftSizeCategory, isAircraftCompatibleWithGate, getGatePurchaseCost } from './gateData';
import { getAircraftType } from '../aircraft/aircraftData';
import { getAircraft } from '../aircraft/fleetService';
import { addMoney } from '../finance/financeService';

// Generate unique IDs
function generateGateId(airportId: string): string {
  return `${airportId}-gate-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function generateSlotId(): string {
  return `slot-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function generateBookingId(): string {
  return `booking-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// Purchase/build a new gate at an airport
export const purchaseGate = displayManager.createActionHandler((
  airportId: string,
  gateType: GateType,
  slotPolicy: SlotPolicyType,
  maxAircraftSize: 'small' | 'medium' | 'large'
): boolean => {
  const airport = getAirport(airportId);
  if (!airport) return false;

  const gameState = getGameState();
  const currentGates = gameState.airportGateStates[airportId] || [];
  const totalGatesAtAirport = currentGates.length;
  
  // Calculate purchase cost
  const cost = getGatePurchaseCost(gateType, totalGatesAtAirport);
  
  if (!gameState.player || gameState.player.money < cost) {
    return false;
  }

  // Generate gate number (simple sequential numbering)
  const gateNumber = `G${totalGatesAtAirport + 1}`;
  
  // Create new gate
  const newGate: Gate = {
    id: generateGateId(airportId),
    airportId,
    gateNumber,
    gateType,
    slotPolicy,
    isActive: true,
    maxAircraftSize,
    basePrice: calculateBasePrice(gateType, totalGatesAtAirport),
    currentBookings: [],
    dailySlots: []
  };

  // Update game state
  const updatedGateStates = {
    ...gameState.airportGateStates,
    [airportId]: [...currentGates, newGate]
  };
  
  updateGameState({ airportGateStates: updatedGateStates });
  
  // Record purchase transaction
  addMoney(
    -cost,
    'Gate Purchase',
    `Purchased ${gateType} gate ${gateNumber} at ${airport.name} (${airport.code})`
  );

  return true;
});

// Calculate base price for gate slots
function calculateBasePrice(gateType: GateType, totalGatesAtAirport: number): number {
  const basePrices = {
    exclusive: 800,
    preferential: 600,
    common: 400
  };
  
  // Adjust based on airport size (number of gates)
  let sizeMultiplier = 1.0;
  if (totalGatesAtAirport <= 5) {
    sizeMultiplier = 0.8;
  } else if (totalGatesAtAirport > 10) {
    sizeMultiplier = 1.3;
  }
  
  return Math.round(basePrices[gateType] * sizeMultiplier);
}

// Initialize daily slots for a gate
export function initializeDailySlots(gate: Gate): GateSlot[] {
  const airport = getAirport(gate.airportId);
  if (!airport) return [];

  const slots: GateSlot[] = [];
  const { start, end } = airport.operatingHours;
  
  // Determine slot duration based on gate policy
  let slotDurationMinutes: number;
  switch (gate.slotPolicy) {
    case 'fixed-blocks':
      slotDurationMinutes = 120; // 2 hours
      break;
    case 'mixed':
      slotDurationMinutes = 90; // 1.5 hours
      break;
    case 'flexible':
      slotDurationMinutes = 60; // 1 hour
      break;
  }

  // Create slots from start to end of operating hours
  let currentTime = { hour: start.hour, minute: start.minute };
  
  while (timeToMinutes(currentTime) < timeToMinutes(end)) {
    const endTime = addMinutesToTime(currentTime, slotDurationMinutes);
    
    // Don't create slots that go beyond operating hours
    if (timeToMinutes(endTime) > timeToMinutes(end)) {
      break;
    }

    const slot: GateSlot = {
      id: generateSlotId(),
      gateId: gate.id,
      startTime: { ...currentTime },
      endTime,
      durationMinutes: slotDurationMinutes,
      status: 'available',
      price: gate.basePrice
    };

    slots.push(slot);
    currentTime = endTime;
  }

  return slots;
}

// Time utility functions
function timeToMinutes(time: TimeSlot): number {
  return time.hour * 60 + time.minute;
}

function addMinutesToTime(time: TimeSlot, minutes: number): TimeSlot {
  const totalMinutes = timeToMinutes(time) + minutes;
  return {
    hour: Math.floor(totalMinutes / 60) % 24,
    minute: totalMinutes % 60
  };
}

// Check gate availability for a specific time and duration
export function checkGateAvailability(
  airportId: string,
  startTime: TimeSlot,
  durationMinutes: number,
  aircraftId?: string
): GateAvailability[] {
  const gameState = getGameState();
  const airportGates = gameState.airportGateStates[airportId] || [];
  const availableGates: GateAvailability[] = [];

  for (const gate of airportGates) {
    if (!gate.isActive) continue;

    // Check aircraft compatibility if specified
    let suitableForAircraft = true;
    if (aircraftId) {
      const aircraft = getAircraft(aircraftId);
      const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : null;
      if (aircraftType) {
        suitableForAircraft = isAircraftCompatibleWithGate(aircraftType.tonnage, gate);
      }
    }

    // Find available slots
    const availableSlots = gate.dailySlots.filter(slot => {
      if (slot.status !== 'available') return false;
      
      // Check if slot overlaps with requested time
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      const requestStart = timeToMinutes(startTime);
      const requestEnd = requestStart + durationMinutes;
      
      // Check for overlap
      return !(requestEnd <= slotStart || requestStart >= slotEnd);
    });

    if (availableSlots.length > 0) {
      const prices = availableSlots.map(slot => slot.price);
      availableGates.push({
        gateId: gate.id,
        gateNumber: gate.gateNumber,
        gateType: gate.gateType,
        availableSlots,
        totalSlotsAvailable: availableSlots.length,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        },
        suitableForAircraft
      });
    }
  }

  return availableGates;
}

// Book a gate slot
export const bookGateSlot = displayManager.createActionHandler((
  request: GateBookingRequest
): GateBookingResponse => {
  const gameState = getGameState();
  
  // Find suitable gates
  const availableGates = checkGateAvailability(
    request.airportId,
    request.requiredSlots[0].startTime,
    request.requiredSlots[0].durationMinutes,
    request.aircraftId
  );

  // Filter by preferred gate type if specified
  let suitableGates = availableGates;
  if (request.preferredGateType) {
    suitableGates = availableGates.filter(gate => gate.gateType === request.preferredGateType);
  }

  // If no gates of preferred type, fall back to any suitable gate
  if (suitableGates.length === 0) {
    suitableGates = availableGates;
  }

  if (suitableGates.length === 0) {
    return {
      success: false,
      error: 'No suitable gates available for the requested time'
    };
  }

  // Select the first suitable gate (could be enhanced with better selection logic)
  const selectedGate = suitableGates[0];
  const gate = gameState.airportGateStates[request.airportId]?.find(g => g.id === selectedGate.gateId);
  
  if (!gate) {
    return {
      success: false,
      error: 'Selected gate not found'
    };
  }

  // Book the slots
  const bookedSlotIds: string[] = [];
  let totalCost = 0;

  for (const requiredSlot of request.requiredSlots) {
    const suitableSlots = selectedGate.availableSlots.filter(slot => {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      const requestStart = timeToMinutes(requiredSlot.startTime);
      const requestEnd = requestStart + requiredSlot.durationMinutes;
      
      return !(requestEnd <= slotStart || requestStart >= slotEnd);
    });

    if (suitableSlots.length === 0) {
      return {
        success: false,
        error: 'No suitable slots available for the requested time'
      };
    }

    const slot = suitableSlots[0];
    slot.status = 'booked';
    slot.bookedBy = request.routeId;
    slot.aircraftId = request.aircraftId;
    
    bookedSlotIds.push(slot.id);
    totalCost += slot.price;
  }

  // Create booking record
  const booking: GateBooking = {
    id: generateBookingId(),
    routeId: request.routeId,
    aircraftId: request.aircraftId,
    gateId: selectedGate.gateId,
    slotIds: bookedSlotIds,
    totalCost,
    isActive: true
  };

  // Update game state
  const updatedBookings = [...gameState.gateBookings, booking];
  gate.currentBookings.push(booking.id);
  
  updateGameState({ gateBookings: updatedBookings });

  // Record transaction
  addMoney(
    -totalCost,
    'Gate Rental',
    `Gate ${gate.gateNumber} at ${getAirport(request.airportId)?.code} for route ${request.routeId.slice(-8)}`
  );

  return {
    success: true,
    bookingId: booking.id,
    gateId: selectedGate.gateId,
    slotIds: bookedSlotIds,
    totalCost
  };
});

// Cancel a gate booking
export const cancelGateBooking = displayManager.createActionHandler((bookingId: string): boolean => {
  const gameState = getGameState();
  const booking = gameState.gateBookings.find(b => b.id === bookingId);
  
  if (!booking || !booking.isActive) return false;

  // Find the gate and free up the slots
  const gate = gameState.airportGateStates[getAirport(booking.gateId.split('-')[0])?.id || '']
    ?.find(g => g.id === booking.gateId);
  
  if (gate) {
    // Free up booked slots
    for (const slotId of booking.slotIds) {
      const slot = gate.dailySlots.find(s => s.id === slotId);
      if (slot) {
        slot.status = 'available';
        slot.bookedBy = undefined;
        slot.aircraftId = undefined;
      }
    }

    // Remove booking from gate
    gate.currentBookings = gate.currentBookings.filter(id => id !== bookingId);
  }

  // Deactivate booking
  booking.isActive = false;
  
  updateGameState({ gateBookings: gameState.gateBookings });
  
  return true;
});

// Get gate statistics for an airport
export function getGateStats(airportId: string): GateStats {
  const gameState = getGameState();
  const airportGates = gameState.airportGateStates[airportId] || [];
  
  const stats: GateStats = {
    airportId,
    totalGates: airportGates.length,
    gatesByType: {
      exclusive: 0,
      preferential: 0,
      common: 0
    },
    utilizationRate: 0,
    averagePricePerSlot: 0,
    totalDailyRevenue: 0
  };

  let totalSlots = 0;
  let bookedSlots = 0;
  let totalSlotValue = 0;
  let totalRevenue = 0;

  for (const gate of airportGates) {
    if (!gate.isActive) continue;
    
    stats.gatesByType[gate.gateType]++;
    
    for (const slot of gate.dailySlots) {
      totalSlots++;
      totalSlotValue += slot.price;
      
      if (slot.status === 'booked') {
        bookedSlots++;
        totalRevenue += slot.price;
      }
    }
  }

  if (totalSlots > 0) {
    stats.utilizationRate = Math.round((bookedSlots / totalSlots) * 100);
    stats.averagePricePerSlot = Math.round(totalSlotValue / totalSlots);
  }
  
  stats.totalDailyRevenue = totalRevenue;
  
  return stats;
}

// Initialize daily slots for all gates (called at start of each day)
export function initializeAllDailySlots(): void {
  const gameState = getGameState();
  const updatedGateStates = { ...gameState.airportGateStates };
  
  for (const airportId in updatedGateStates) {
    for (const gate of updatedGateStates[airportId]) {
      if (gate.isActive) {
        gate.dailySlots = initializeDailySlots(gate);
      }
    }
  }
  
  updateGameState({ airportGateStates: updatedGateStates });
} 