// Route type definitions for Blueskye Air Management Game

export interface Route {
  id: string;
  originCityId: string;
  destinationCityId: string;
  aircraftId: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  departureTime: Date;
  estimatedArrival: Date;
  actualArrival?: Date;
  
  // Flight details
  distance: number; // km
  flightTime: number; // hours
  passengers: number;
  maxPassengers: number;
  
  // Financial
  pricePerPassenger: number; // euros
  totalRevenue: number;
  fuelCost: number;
  profit: number;
  
  // Progress tracking
  currentProgress: number; // 0-100%
  remainingTime: number; // hours
}

export interface RouteTemplate {
  id: string;
  name: string;
  originCityId: string;
  destinationCityId: string;
  frequency: 'daily' | 'weekly'; // How often this route runs
  isActive: boolean;
  defaultPricing: number; // base price per passenger
}

export interface RouteStats {
  totalRoutes: number;
  activeRoutes: number;
  completedRoutes: number;
  totalRevenue: number;
  totalProfit: number;
  averageLoadFactor: number; // percentage of seats filled
}

export interface FlightPlan {
  routeId: string;
  aircraftId: string;
  scheduledDeparture: Date;
  passengerDemand: number;
  estimatedProfit: number;
} 