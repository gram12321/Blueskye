// Route type definitions for Blueskye Air Management Game

// Permanent route definition
export interface Route {
  id: string;
  name: string;
  originCityId: string;
  destinationCityId: string;
  distance: number; // km
  flightTime: number; // hours (one way)
  isActive: boolean;
  assignedAircraftIds: string[]; // Aircraft assigned to this route
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