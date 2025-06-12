// Aircraft type definitions for Blueskye Air Management Game

export interface AircraftType {
  id: string;
  name: string;
  manufacturer: string;
  speed: number; // km/h
  range: number; // km
  maxPassengers: number;
  cost: number; // euros
  fuelConsumption: number; // liters per km
  maintenanceCost: number; // euros per week
}

export interface Aircraft {
  id: string;
  aircraftTypeId: string;
  purchaseDate: Date;
  totalFlightHours: number;
  currentRoute?: string; // route ID if currently assigned
  status: 'available' | 'in-flight' | 'maintenance';
  condition: number; // 0-100, affects performance and maintenance costs
}

export interface FleetStats {
  totalAircraft: number;
  availableAircraft: number;
  inFlightAircraft: number;
  maintenanceAircraft: number;
  totalValue: number;
  weeklyMaintenanceCost: number;
} 