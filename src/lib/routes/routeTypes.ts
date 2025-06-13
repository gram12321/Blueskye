// Route type definitions for Blueskye Air Management Game

// Aircraft scheduling information for a route
export interface AircraftSchedule {
  aircraftId: string;
  dailyFlights: number; // Number of round trips per day
  totalHoursPerDay: number; // Total hours used per day
  startTime?: number; // Optional start time (0-23)
}

// Permanent route definition - now uses airports instead of cities
export interface Route {
  id: string;
  name: string;
  originAirportId: string;
  destinationAirportId: string;
  distance: number; // km
  flightTime: number; // hours (one way)
  isActive: boolean;
  assignedAircraftIds: string[]; // Aircraft assigned to this route
  aircraftSchedules: AircraftSchedule[]; // Detailed scheduling information
  pricePerPassenger: number; // euros
  
  // Statistics
  totalFlights: number;
  totalRevenue: number;
  totalProfit: number;
  averageLoadFactor: number;
}

// Individual flight instance on a route
export interface Flight {
  id: string;
  routeId: string;
  aircraftId: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  direction: 'outbound' | 'return'; // For round trips
  departureTime: Date;
  estimatedArrival: Date;
  actualArrival?: Date;
  
  // Flight details
  passengers: number;
  maxPassengers: number;
  
  // Financial
  totalRevenue: number;
  operationalCosts: number;
  profit: number;
  
  // Progress tracking
  currentProgress: number; // 0-100%
  remainingTime: number; // hours
  flightTime: number; // hours - actual flight time (one way)
  originTurnTime: number; // hours - turnaround time at origin airport
  destinationTurnTime: number; // hours - turnaround time at destination airport
  totalRoundTripTime: number; // hours - total time for complete round trip
  currentPhase: 'origin-turn' | 'outbound' | 'destination-turn' | 'return'; // Current phase of the flight
}

export interface RouteAssignment {
  routeId: string;
  aircraftId: string;
  assignedDate: Date;
}

export interface RouteStats {
  totalRoutes: number;
  activeRoutes: number;
  inactiveRoutes: number;
  assignedAircraft: number;
  totalFlights: number;
  totalRevenue: number;
  totalProfit: number;
  averageLoadFactor: number; // percentage of seats filled
} 