// Simplified gate management type definitions for Blueskye Air Management Game

export type GateType = 'exclusive' | 'preferential' | 'common';

export type GateSlotStatus = 'available' | 'booked' | 'blocked';

// SlotPolicyType remains, as it's per-gate
export type SlotPolicyType = 'flexible' | 'mixed' | 'fixed-blocks';

// Time-based slot representation (0-23 hours, 0-59 minutes)
export interface TimeSlot {
  hour: number;
  minute: number;
}

// Individual gate slot (time-based allocation unit)
export interface GateSlot {
  id: string;
  gateId: string;
  startTime: TimeSlot;
  endTime: TimeSlot;
  durationMinutes: number;
  status: GateSlotStatus;
  bookedBy?: string; // Route ID if booked
  aircraftId?: string; // Aircraft ID if assigned
  price: number; // Calculated price for this specific slot
}

// Gate booking record
export interface GateBooking {
  id: string;
  routeId: string;
  aircraftId: string;
  gateId: string;
  slotIds: string[]; // Array of slot IDs for this booking
  totalCost: number;
  isActive: boolean;
}

// Individual gate (purchasable/manageable by player)
export interface Gate {
  id: string;
  airportId: string;
  gateNumber: string; // Display name (e.g., "A1", "B12")
  gateType: GateType;
  slotPolicy: SlotPolicyType; // Each gate can have its own policy
  isActive: boolean;
  
  // Physical properties
  maxAircraftSize: 'small' | 'medium' | 'large'; // Based on aircraft tonnage
  
  // Operational properties
  basePrice: number; // Base price per slot in euros
  
  // Current bookings and availability
  currentBookings: string[]; // Array of booking IDs
  dailySlots: GateSlot[]; // All slots for current day
}

// Gate pricing calculation parameters
export interface GatePricingParams {
  basePrice: number;
  gateType: GateType;
  isInternational: boolean;
  slotTime: TimeSlot;
  isHoliday: boolean;
  isWeekend: boolean;
  totalGatesAtAirport: number; // Using this instead of AirportSizeCategory
}

// Gate availability query result
export interface GateAvailability {
  gateId: string;
  gateNumber: string;
  gateType: GateType;
  availableSlots: GateSlot[];
  totalSlotsAvailable: number;
  priceRange: {
    min: number;
    max: number;
  };
  suitableForAircraft: boolean; // Based on aircraft size compatibility
}

// Gate booking request
export interface GateBookingRequest {
  routeId: string;
  aircraftId: string;
  airportId: string;
  preferredGateType?: GateType;
  requiredSlots: {
    startTime: TimeSlot;
    durationMinutes: number;
  }[];
}

// Gate booking response
export interface GateBookingResponse {
  success: boolean;
  bookingId?: string;
  gateId?: string;
  slotIds?: string[];
  totalCost?: number;
  error?: string;
}

// Gate statistics and analytics
export interface GateStats {
  airportId: string;
  totalGates: number;
  gatesByType: {
    exclusive: number;
    preferential: number;
    common: number;
  };
  utilizationRate: number; // Percentage of slots currently booked
  averagePricePerSlot: number;
  totalDailyRevenue: number;
}

// Gate conflict detection result
export interface GateConflict {
  type: 'time-overlap' | 'aircraft-size-mismatch' | 'gate-unavailable';
  gateId: string;
  conflictingBookingId?: string;
  conflictingSlotIds?: string[];
  message: string;
}

// Utility type for time calculations
export interface TimeRange {
  start: TimeSlot;
  end: TimeSlot;
  durationMinutes: number;
} 